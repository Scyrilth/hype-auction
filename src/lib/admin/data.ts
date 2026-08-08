import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import type {
  Auction,
} from "@/lib/database.types";
import {
  fetchAllLedgerEvents,
  lamportsToSol,
  mapLedgerEventToEscrowState,
  type EscrowTransactionWithAuction,
  type EscrowLedgerEventType,
} from "@/lib/escrow-ledger";
import { fetchEarlyEndedAuctions as loadEarlyEndedAuctions } from "@/lib/auction-early-end";
import { getEffectiveBid } from "@/lib/parse-auction";
import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase, getNotificationClient } from "@/lib/supabase";

import { isRealAuction, passesDummyFilter } from "./filters";
import {
  computeEscrowMonitorFeesSol,
  computeEscrowMonitorPills,
  isEscrowMonitorActionsDisabled,
} from "./escrow-monitor";
import type {
  AdminCategoryGmv,
  AdminCategoryRow,
  AdminGmvMonth,
  AdminOverviewStats,
  AdminStatusCount,
  AdminUsersMonth,
  AdminVendorRow,
  BuyerStrikeRow,
  DisputeRow,
  EarlyEndedAuctionRow,
  EscrowMonitorRow,
  EscrowMonitorData,
  EscrowStateCount,
  FlaggedOrder,
  AdminLiveAuctionRow,
  RecentUserRow,
  AdminUserProfile,
} from "./types";

function auctionAmountSol(auction: Auction): number {
  if (auction.escrow_amount_lamports && auction.escrow_amount_lamports > 0) {
    return auction.escrow_amount_lamports / LAMPORTS_PER_SOL;
  }
  return getEffectiveBid(auction);
}

function auctionCurrentBidSol(auction: Auction): number {
  const bid = Number(auction.current_bid);
  return Number.isFinite(bid) ? bid : 0;
}

function dedupeAuctionsById(auctions: Auction[]): Auction[] {
  const byId = new Map<string, Auction>();
  for (const auction of auctions) {
    if (!byId.has(auction.id)) {
      byId.set(auction.id, auction);
    }
  }
  return [...byId.values()];
}

function isLegacyDummyRolexDispute(auction: Auction): boolean {
  const sig = auction.escrow_tx_signature ?? "";
  return (
    auction.escrow_state === "disputed" &&
    sig.startsWith("dummy_tx_009") &&
    auction.title.toLowerCase().includes("rolex")
  );
}

async function fetchEndedEscrowAuctions(
  showDummyData: boolean
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "ended")
    .not("escrow_state", "is", null)
    .neq("escrow_state", "");

  if (error) throw error;

  return (data ?? [])
    .map((row) => parseAuctionRow(row as Record<string, unknown>))
    .filter((a) => Boolean(a.escrow_state?.trim()) && a.escrow_state !== "none")
    .filter((a) => passesDummyFilter(a, showDummyData));
}

function daysBetween(from: string, to = new Date()): number {
  const ms = to.getTime() - new Date(from).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

async function getTopBidders(auctionIds: string[]): Promise<Map<string, string>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await supabase
    .from("bids")
    .select("auction_id, bidder_wallet, amount")
    .in("auction_id", auctionIds)
    .order("amount", { ascending: false });

  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const id = row.auction_id as string;
    if (!map.has(id)) map.set(id, row.bidder_wallet as string);
  }
  return map;
}

async function getThreadIdsByAuction(
  auctionIds: string[]
): Promise<Map<string, string>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await supabase
    .from("message_threads")
    .select("id, auction_id")
    .in("auction_id", auctionIds);

  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.auction_id) map.set(row.auction_id as string, row.id as string);
  }
  return map;
}

export async function fetchAdminOverview(
  showDummyData: boolean,
  solUsdRate: number
): Promise<{
  stats: AdminOverviewStats;
  gmvByMonth: AdminGmvMonth[];
  usersByMonth: AdminUsersMonth[];
  categoryGmv: AdminCategoryGmv[];
  statusCounts: AdminStatusCount[];
  topVendors: AdminVendorRow[];
  topCategories: AdminCategoryRow[];
}> {
  const [auctionsRes, usersRes, liveRes] = await Promise.all([
    supabase.from("auctions").select("*"),
    supabase.from("users").select("wallet_address, created_at"),
    supabase
      .from("auctions")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),
  ]);

  if (auctionsRes.error) throw auctionsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (liveRes.error) throw liveRes.error;

  const auctions = (auctionsRes.data ?? [])
    .map((row) => parseAuctionRow(row as Record<string, unknown>))
    .filter((a) => passesDummyFilter(a, showDummyData));

  const released = auctions.filter((a) =>
    ["released", "complete"].includes(a.escrow_state)
  );
  const disputed = auctions.filter((a) => a.escrow_state === "disputed");
  const completed = auctions.filter((a) =>
    ["released", "complete", "refunded", "disputed"].includes(a.escrow_state)
  );

  const totalGmvSol = released.reduce((s, a) => s + auctionAmountSol(a), 0);

  const now = new Date();
  const gmvByMonth: AdminGmvMonth[] = [];
  const usersByMonth: AdminUsersMonth[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
    const month = d.getMonth();
    const year = d.getFullYear();

    const monthGmv = released
      .filter((a) => {
        const date = new Date(
          a.payment_completed_at ?? a.escrow_funded_at ?? a.end_time
        );
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((s, a) => s + auctionAmountSol(a), 0);

    gmvByMonth.push({ label, valueSol: monthGmv });

    const monthUsers = (usersRes.data ?? []).filter((u) => {
      const date = new Date(u.created_at as string);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;

    usersByMonth.push({ label, count: monthUsers });
  }

  const categoryTotals = new Map<string, number>();
  for (const a of released) {
    const cat = a.category?.trim() || "Uncategorized";
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + auctionAmountSol(a));
  }
  const categoryGrand = [...categoryTotals.values()].reduce((s, v) => s + v, 0);
  const categoryGmv: AdminCategoryGmv[] = [...categoryTotals.entries()]
    .map(([category, valueSol]) => ({
      category,
      valueSol,
      percent: categoryGrand > 0 ? (valueSol / categoryGrand) * 100 : 0,
    }))
    .sort((a, b) => b.valueSol - a.valueSol);

  const statusMap: Record<string, number> = {
    released: 0,
    funded: 0,
    refunded: 0,
    disputed: 0,
  };
  for (const a of auctions) {
    if (["released", "complete"].includes(a.escrow_state)) {
      statusMap.released += 1;
    } else if (["funded", "shipped", "pending"].includes(a.escrow_state)) {
      statusMap.funded += 1;
    } else if (a.escrow_state === "refunded") {
      statusMap.refunded += 1;
    } else if (a.escrow_state === "disputed") {
      statusMap.disputed += 1;
    }
  }

  const vendorStats = new Map<
    string,
    { sales: number; volume: number; disputes: number }
  >();
  for (const a of auctions) {
    if (!a.seller_wallet) continue;
    const entry = vendorStats.get(a.seller_wallet) ?? {
      sales: 0,
      volume: 0,
      disputes: 0,
    };
    if (["released", "complete"].includes(a.escrow_state)) {
      entry.sales += 1;
      entry.volume += auctionAmountSol(a);
    }
    if (a.escrow_state === "disputed") entry.disputes += 1;
    vendorStats.set(a.seller_wallet, entry);
  }

  const vendorWallets = [...vendorStats.keys()];
  const { data: vendorUsers } = vendorWallets.length
    ? await supabase
        .from("users")
        .select("wallet_address, username")
        .in("wallet_address", vendorWallets)
    : { data: [] };

  const usernameByWallet = new Map(
    (vendorUsers ?? []).map((u) => [
      u.wallet_address as string,
      u.username as string | null,
    ])
  );

  const topVendors: AdminVendorRow[] = [...vendorStats.entries()]
    .map(([wallet, stats]) => ({
      wallet,
      username: usernameByWallet.get(wallet) ?? null,
      salesCount: stats.sales,
      volumeSol: stats.volume,
      avgSaleSol: stats.sales > 0 ? stats.volume / stats.sales : 0,
      disputeRate:
        stats.sales + stats.disputes > 0
          ? (stats.disputes / (stats.sales + stats.disputes)) * 100
          : 0,
    }))
    .sort((a, b) => b.volumeSol - a.volumeSol)
    .slice(0, 10);

  const categoryRows = new Map<
    string,
    { listings: number; volume: number; sales: number }
  >();
  for (const a of auctions) {
    const cat = a.category?.trim() || "Uncategorized";
    const entry = categoryRows.get(cat) ?? { listings: 0, volume: 0, sales: 0 };
    entry.listings += 1;
    if (["released", "complete"].includes(a.escrow_state)) {
      entry.volume += auctionAmountSol(a);
      entry.sales += 1;
    }
    categoryRows.set(cat, entry);
  }

  const topCategories: AdminCategoryRow[] = [...categoryRows.entries()]
    .map(([category, stats]) => ({
      category,
      listingCount: stats.listings,
      volumeSol: stats.volume,
      avgSaleSol: stats.sales > 0 ? stats.volume / stats.sales : 0,
    }))
    .sort((a, b) => b.volumeSol - a.volumeSol);

  void solUsdRate;

  return {
    stats: {
      totalGmvSol,
      activeListings: liveRes.count ?? 0,
      totalUsers: usersRes.data?.length ?? 0,
      disputeRate:
        completed.length > 0 ? (disputed.length / completed.length) * 100 : 0,
    },
    gmvByMonth,
    usersByMonth,
    categoryGmv,
    statusCounts: Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    })),
    topVendors,
    topCategories,
  };
}

export async function fetchFlaggedOrders(
  showDummyData: boolean
): Promise<FlaggedOrder[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "ended")
    .eq("escrow_state", "funded")
    .or("tracking_number.is.null,tracking_number.eq.")
    .lt("payment_completed_at", sevenDaysAgo.toISOString());

  if (error) throw error;

  const auctions = dedupeAuctionsById(
    (data ?? [])
      .map((row) => parseAuctionRow(row as Record<string, unknown>))
      .filter((a) => passesDummyFilter(a, showDummyData))
  );

  const ids = auctions.map((a) => a.id);
  const topBidders = await getTopBidders(ids);

  return auctions.map((auction) => {
    const paymentDate = auction.payment_completed_at as string;
    const daysSince = daysBetween(paymentDate);
    const isInternational =
      (auction.international_shipping_usd ?? 0) >
      (auction.domestic_shipping_usd ?? 0);
    const graceDays = isInternational ? 14 : 5;
    const graceExpires = new Date(paymentDate);
    graceExpires.setDate(graceExpires.getDate() + 7 + graceDays);

    return {
      auctionId: auction.id,
      reference: auction.reference_number,
      itemTitle: auction.title,
      sellerWallet: auction.seller_wallet,
      buyerWallet: topBidders.get(auction.id) ?? "Unknown",
      paymentDate,
      daysSincePayment: daysSince,
      estDeliveryDate: null,
      graceLabel: isInternational ? "International +14d" : "Domestic +5d",
      graceExpiresAt: graceExpires.toISOString(),
      amountSol: auctionCurrentBidSol(auction),
      isInternational,
      escrowState: auction.escrow_state,
    };
  });
}

export async function fetchEarlyEndedAuctions(
  showDummyData: boolean
): Promise<EarlyEndedAuctionRow[]> {
  return loadEarlyEndedAuctions(showDummyData);
}

export async function fetchAdminLiveAuctions(
  showDummyData: boolean
): Promise<AdminLiveAuctionRow[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("id, title, seller_wallet, current_bid, start_price, end_time, is_dummy")
    .eq("status", "live")
    .order("end_time", { ascending: true });

  if (error) throw error;

  const auctions = (data ?? []).filter((row) =>
    showDummyData ? true : !row.is_dummy
  );
  const ids = auctions.map((row) => row.id as string);

  const bidCounts = new Map<string, number>();
  if (ids.length) {
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("auction_id")
      .in("auction_id", ids);

    if (bidsError) throw bidsError;

    for (const bid of bids ?? []) {
      const auctionId = bid.auction_id as string;
      bidCounts.set(auctionId, (bidCounts.get(auctionId) ?? 0) + 1);
    }
  }

  return auctions.map((row) => {
    const auction = parseAuctionRow(row as Record<string, unknown>);
    return {
      auctionId: auction.id,
      itemTitle: auction.title,
      sellerWallet: auction.seller_wallet,
      currentBidSol: getEffectiveBid(auction),
      bidCount: bidCounts.get(auction.id) ?? 0,
      endTime: auction.end_time,
    };
  });
}

export async function fetchDisputes(
  showDummyData: boolean,
  resolved: boolean,
  solUsdRate: number
): Promise<DisputeRow[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .in(
      "escrow_state",
      resolved
        ? ["complete", "refunded", "released"]
        : ["disputed"]
    );

  if (error) throw error;

  let auctions = dedupeAuctionsById(
    (data ?? [])
      .map((row) => parseAuctionRow(row as Record<string, unknown>))
      .filter((a) => passesDummyFilter(a, showDummyData))
      .filter((a) => !isLegacyDummyRolexDispute(a))
  );

  if (resolved) {
    auctions = auctions.filter((a) =>
      ["complete", "refunded", "released"].includes(a.escrow_state)
    );
  } else {
    auctions = auctions.filter((a) => a.escrow_state === "disputed");
  }

  const ids = auctions.map((a) => a.id);
  const [topBidders, threads, sellers] = await Promise.all([
    getTopBidders(ids),
    getThreadIdsByAuction(ids),
    supabase
      .from("users")
      .select("wallet_address, username")
      .in(
        "wallet_address",
        [...new Set(auctions.map((a) => a.seller_wallet))]
      ),
  ]);

  const sellerNames = new Map(
    (sellers.data ?? []).map((u) => [
      u.wallet_address as string,
      u.username as string | null,
    ])
  );

  return auctions.map((auction) => {
    const openedAt =
      auction.escrow_funded_at ?? auction.payment_completed_at ?? auction.end_time;
    const amountSol = auctionAmountSol(auction);

    return {
      auctionId: auction.id,
      reference: auction.reference_number,
      itemTitle: auction.title,
      sellerWallet: auction.seller_wallet,
      buyerWallet: topBidders.get(auction.id) ?? "Unknown",
      sellerUsername: sellerNames.get(auction.seller_wallet) ?? null,
      openedAt,
      daysOpen: daysBetween(openedAt),
      amountSol,
      usdApprox: amountSol * solUsdRate,
      description: auction.description,
      imageUrl: auction.image_url,
      additionalImages: auction.additional_images,
      threadId: threads.get(auction.id) ?? null,
      resolved,
      outcome:
        resolved && auction.escrow_state === "refunded"
          ? "buyer"
          : resolved
            ? "seller"
            : null,
    };
  });
}

function escrowFlowDirection(
  eventType: EscrowLedgerEventType
): "INWARD" | "OUTWARD" {
  return eventType === "funded" ? "INWARD" : "OUTWARD";
}

function ledgerEventLabel(eventType: EscrowLedgerEventType): string {
  switch (eventType) {
    case "funded":
      return "Funded";
    case "shipped":
      return "Shipped";
    case "released":
      return "Released";
    case "fee_collected":
      return "Fee Collected";
    case "refunded":
      return "Refunded";
    case "disputed":
      return "Disputed";
    case "dispute_resolved":
      return "Dispute Resolved";
    default:
      return eventType;
  }
}

function buildTrackingStatus(
  auction: EscrowTransactionWithAuction["auction"]
): string {
  const hasTracking = Boolean(auction.tracking_number?.trim());
  if (hasTracking) {
    return `${auction.tracking_courier ?? "Courier"}: ${auction.tracking_number}`;
  }
  if (auction.shipping_status === "shipped") return "Shipped";
  if (auction.shipping_status === "delivered") return "Delivered";
  return "Not uploaded";
}

function buildFlaggedByAuction(
  events: EscrowTransactionWithAuction[]
): Map<string, boolean> {
  const flagged = new Map<string, boolean>();

  for (const event of events) {
    if (event.event_type !== "funded") continue;

    const auction = event.auction;
    const hasTracking = Boolean(auction.tracking_number?.trim());
    const paymentDate = auction.payment_completed_at;
    const escrowState = mapLedgerEventToEscrowState(event.event_type);

    flagged.set(
      event.auction_id,
      escrowState === "funded" &&
        !hasTracking &&
        paymentDate != null &&
        daysBetween(paymentDate) >= 7
    );
  }

  return flagged;
}

export async function fetchEscrowMonitor(
  showDummyData: boolean
): Promise<EscrowMonitorData> {
  const allEvents = await fetchAllLedgerEvents();
  const events = allEvents
    .filter((event) => passesDummyFilter(event.auction, showDummyData))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const auctionIds = [...new Set(events.map((event) => event.auction_id))];
  const [topBidders, threads, flaggedByAuction] = await Promise.all([
    getTopBidders(auctionIds),
    getThreadIdsByAuction(auctionIds),
    Promise.resolve(buildFlaggedByAuction(events)),
  ]);

  const rows: EscrowMonitorRow[] = events.map((event) => {
    const auction = event.auction;
    const auctionEscrowState = auction.escrow_state ?? "none";
    const buyerWallet =
      event.buyer_wallet ?? topBidders.get(event.auction_id) ?? "Unknown";

    const row: EscrowMonitorRow = {
      ledgerId: event.id,
      auctionId: event.auction_id,
      platformTransactionId: event.platform_transaction_id,
      reference: auction.reference_number,
      itemTitle: auction.title,
      sellerWallet: auction.seller_wallet,
      buyerWallet,
      fromWallet: event.from_wallet,
      toWallet: event.to_wallet,
      amountSol: lamportsToSol(event.amount_lamports),
      paymentDate: auction.payment_completed_at ?? null,
      createdAt: event.created_at,
      eventType: event.event_type,
      eventLabel: ledgerEventLabel(event.event_type),
      escrowFlowDirection: escrowFlowDirection(event.event_type),
      auctionEscrowState,
      daysInState: daysBetween(event.created_at),
      trackingStatus: buildTrackingStatus(auction),
      threadId: event.thread_id ?? threads.get(event.auction_id) ?? null,
      isDummy: !isRealAuction(auction),
      isFlagged: flaggedByAuction.get(event.auction_id) ?? false,
      isPlatformFee: event.is_platform_fee,
      isTerminal: false,
      onChainSignature: event.on_chain_signature,
      solscanUrl: event.solscan_url,
      solUsdRateAtPayment: auction.sol_usd_rate_at_payment,
      bidSol:
        event.bid_lamports != null ? lamportsToSol(event.bid_lamports) : null,
      shippingSol:
        event.shipping_lamports != null
          ? lamportsToSol(event.shipping_lamports)
          : null,
    };
    row.isTerminal = isEscrowMonitorActionsDisabled(row);
    return row;
  });

  const pills = computeEscrowMonitorPills(rows);

  const totalVolumeSol = events
    .filter((event) => event.event_type === "funded")
    .reduce((sum, event) => sum + lamportsToSol(event.amount_lamports), 0);

  const auctionsById = new Map<string, EscrowTransactionWithAuction["auction"]>();
  for (const event of events) {
    auctionsById.set(event.auction_id, event.auction);
  }

  const stateCountMap = new Map<string, number>();
  for (const auction of auctionsById.values()) {
    const state = auction.escrow_state ?? "none";
    stateCountMap.set(state, (stateCountMap.get(state) ?? 0) + 1);
  }

  const stateCounts: EscrowStateCount[] = [...stateCountMap.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  return {
    rows,
    pills,
    platformFeesSol: computeEscrowMonitorFeesSol(rows),
    totalVolumeSol,
    stateCounts,
  };
}

function deriveUserStatus(strikes: BuyerStrikeRow[]): AdminUserProfile["status"] {
  if (!strikes.length) return "active";
  const now = Date.now();
  const active = strikes.filter(
    (s) => !s.expires_at || new Date(s.expires_at).getTime() > now
  );
  if (!active.length) return "active";
  if (active.some((s) => s.reason === "ban")) return "banned";
  if (active.some((s) => s.reason === "suspension_7d")) return "suspended";
  if (active.some((s) => s.reason === "cooldown_24h")) return "warned";
  if (active.some((s) => s.reason === "warning")) return "warned";
  return "warned";
}

export async function fetchRecentUsers(): Promise<RecentUserRow[]> {
  const db = getNotificationClient();
  const { data: users, error } = await db
    .from("users")
    .select("wallet_address, username, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const wallets = (users ?? []).map((u) => u.wallet_address as string);
  const { data: strikes } = wallets.length
    ? await db
        .from("buyer_strikes")
        .select("*")
        .in("wallet_address", wallets)
    : { data: [] };

  const strikesByWallet = new Map<string, BuyerStrikeRow[]>();
  for (const row of strikes ?? []) {
    const wallet = row.wallet_address as string;
    const list = strikesByWallet.get(wallet) ?? [];
    list.push(row as BuyerStrikeRow);
    strikesByWallet.set(wallet, list);
  }

  return (users ?? []).map((u) => {
    const wallet = u.wallet_address as string;
    const userStrikes = strikesByWallet.get(wallet) ?? [];
    return {
      wallet,
      username: (u.username as string | null) ?? null,
      avatarUrl: (u.avatar_url as string | null) ?? null,
      createdAt: u.created_at as string,
      strikeCount: userStrikes.length,
      status: deriveUserStatus(userStrikes),
    };
  });
}

export async function searchAdminUser(
  query: string
): Promise<AdminUserProfile | null> {
  const db = getNotificationClient();
  const trimmed = query.trim().replace(/^@+/, "");
  if (!trimmed) return null;

  let userRow = null;

  const byWallet = await db
    .from("users")
    .select("*")
    .eq("wallet_address", trimmed)
    .maybeSingle();

  if (byWallet.data) userRow = byWallet.data;
  else {
    const byUsername = await db
      .from("users")
      .select("*")
      .ilike("username", trimmed)
      .maybeSingle();
    if (byUsername.data) userRow = byUsername.data;
  }

  if (!userRow) return null;

  const wallet = userRow.wallet_address as string;

  const [listings, sales, bids, reviews, strikes] = await Promise.all([
    db
      .from("auctions")
      .select("id", { count: "exact", head: true })
      .eq("seller_wallet", wallet),
    db
      .from("auctions")
      .select("id", { count: "exact", head: true })
      .eq("seller_wallet", wallet)
      .in("escrow_state", ["released", "complete"]),
    db
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("bidder_wallet", wallet),
    db
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .or(`vendor_wallet.eq.${wallet},reviewer_wallet.eq.${wallet}`),
    db.from("buyer_strikes").select("*").eq("wallet_address", wallet),
  ]);

  const strikeRows = (strikes.data ?? []) as BuyerStrikeRow[];

  return {
    wallet_address: wallet,
    username: (userRow.username as string | null) ?? null,
    avatar_url: (userRow.avatar_url as string | null) ?? null,
    reputation: Number(userRow.reputation ?? 0),
    created_at: userRow.created_at as string,
    shop_name: (userRow.shop_name as string | null) ?? null,
    banner_image: (userRow.banner_image as string | null) ?? null,
    bio: (userRow.bio as string | null) ?? null,
    shop_description: (userRow.shop_description as string | null) ?? null,
    social_twitter: (userRow.social_twitter as string | null) ?? null,
    social_instagram: (userRow.social_instagram as string | null) ?? null,
    is_vendor: Boolean(userRow.is_vendor),
    is_verified: Boolean(userRow.is_verified),
    followers_count: Number(userRow.followers_count ?? 0),
    total_sales: Number(userRow.total_sales ?? 0),
    total_volume: Number(userRow.total_volume ?? 0),
    average_rating: Number(userRow.average_rating ?? 0),
    show_copy_wallet: Boolean(userRow.show_copy_wallet ?? true),
    show_won_auctions: Boolean(userRow.show_won_auctions ?? true),
    country: (userRow.country as string | null) ?? null,
    ships_internationally: Boolean(userRow.ships_internationally),
    age_confirmed_at: (userRow.age_confirmed_at as string | null) ?? null,
    tos_accepted_at: (userRow.tos_accepted_at as string | null) ?? null,
    tos_version: (userRow.tos_version as string | null) ?? null,
    listingsCount: listings.count ?? 0,
    salesCount: sales.count ?? 0,
    purchasesCount: bids.count ?? 0,
    reviewsCount: reviews.count ?? 0,
    strikeCount: strikeRows.length,
    status: deriveUserStatus(strikeRows),
  };
}

export async function fetchUserStrikes(wallet: string): Promise<BuyerStrikeRow[]> {
  const db = getNotificationClient();
  const { data, error } = await db
    .from("buyer_strikes")
    .select("*")
    .eq("wallet_address", wallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BuyerStrikeRow[];
}

export async function fetchAdminThreadMessages(threadId: string) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
