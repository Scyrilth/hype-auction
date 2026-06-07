"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildVendorSuggestions,
  flattenSuggestions,
  type AuctionSuggestionSource,
  type SuggestionGroupOrder,
} from "@/lib/vendor-suggestions";
import { auctionMatchesSearchQuery } from "@/lib/auction-search";
import { normalizeSearchQuery } from "@/lib/search";
import { resolveCategoryLabels } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import { getVendorDirectory, type VendorDirectoryEntry } from "@/lib/vendors";

async function fetchBidCounts(
  auctionIds: string[]
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await supabase
    .from("bids")
    .select("auction_id")
    .in("auction_id", auctionIds);

  if (error) return new Map();

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.auction_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function fetchMatchingAuctions(
  query: string,
  sellerWallets: string[] | null
): Promise<AuctionSuggestionSource[]> {
  const q = normalizeSearchQuery(query);
  if (q.length < 2) return [];

  const resolvedLabels = resolveCategoryLabels(query);
  const requests = [
    supabase
      .from("auctions")
      .select(
        "id, title, description, condition, category, item_details, seller_wallet, current_bid, status, end_time"
      )
      .or(
        `title.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%,condition.ilike.%${q}%`
      )
      .limit(40),
  ];

  if (resolvedLabels.length) {
    requests.push(
      supabase
        .from("auctions")
        .select(
          "id, title, description, condition, category, item_details, seller_wallet, current_bid, status, end_time"
        )
        .in("category", resolvedLabels)
        .limit(20)
    );
  }

  requests.push(
    supabase
      .from("auctions")
      .select(
        "id, title, description, condition, category, item_details, seller_wallet, current_bid, status, end_time"
      )
      .not("item_details", "eq", "{}")
      .limit(60)
  );

  const results = await Promise.all(
    requests.map((request) =>
      sellerWallets?.length
        ? request.in("seller_wallet", sellerWallets)
        : request
    )
  );

  const rowsById = new Map<string, Record<string, unknown>>();
  for (const { data, error } of results) {
    if (error) continue;
    for (const row of data ?? []) {
      rowsById.set(row.id as string, row as Record<string, unknown>);
    }
  }

  if (!rowsById.size) return [];

  const auctionIds = [...rowsById.keys()];
  const bidCounts = await fetchBidCounts(auctionIds);

  return auctionIds
    .map((id) => {
      const row = rowsById.get(id)!;
      const itemDetails = row.item_details;
      return {
        id,
        title: row.title as string,
        description: (row.description as string | null) ?? null,
        condition: (row.condition as string | null) ?? null,
        category: (row.category as string | null) ?? null,
        item_details:
          itemDetails &&
          typeof itemDetails === "object" &&
          !Array.isArray(itemDetails)
            ? (itemDetails as Record<string, string>)
            : {},
        seller_wallet: row.seller_wallet as string,
        current_bid: Number(row.current_bid),
        status: row.status as string,
        end_time: row.end_time as string,
        bid_count: bidCounts.get(id) ?? 0,
      } satisfies AuctionSuggestionSource;
    })
    .filter((auction) => auctionMatchesSearchQuery(auction, query));
}

export function useSearchSuggestions({
  query,
  vendors: vendorsProp,
  fetchVendors = false,
  scope = "vendor-wallets",
  groupOrder = "vendor-directory",
  maxTotal = 6,
}: {
  query: string;
  vendors?: VendorDirectoryEntry[];
  fetchVendors?: boolean;
  scope?: "vendor-wallets" | "global";
  groupOrder?: SuggestionGroupOrder;
  maxTotal?: number;
}) {
  const [fetchedVendors, setFetchedVendors] = useState<VendorDirectoryEntry[]>(
    []
  );
  const [vendorsLoading, setVendorsLoading] = useState(fetchVendors);
  const [matchingAuctions, setMatchingAuctions] = useState<
    AuctionSuggestionSource[]
  >([]);

  const vendors = vendorsProp ?? fetchedVendors;
  const queryReady = normalizeSearchQuery(query).length >= 2;

  useEffect(() => {
    if (!fetchVendors) return;

    let cancelled = false;

    async function loadVendors() {
      try {
        const data = await getVendorDirectory();
        if (!cancelled) setFetchedVendors(data);
      } catch {
        if (!cancelled) setFetchedVendors([]);
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    }

    loadVendors();
    return () => {
      cancelled = true;
    };
  }, [fetchVendors]);

  useEffect(() => {
    if (!queryReady || (fetchVendors && vendorsLoading)) {
      setMatchingAuctions([]);
      return;
    }

    let cancelled = false;
    const wallets =
      scope === "vendor-wallets"
        ? vendors.map((entry) => entry.vendor.wallet_address)
        : null;

    async function loadAuctions() {
      const data = await fetchMatchingAuctions(query, wallets);
      if (!cancelled) setMatchingAuctions(data);
    }

    loadAuctions();
    return () => {
      cancelled = true;
    };
  }, [query, queryReady, vendors, scope, fetchVendors, vendorsLoading]);

  const suggestionGroups = useMemo(
    () =>
      buildVendorSuggestions(
        vendors,
        query,
        matchingAuctions,
        maxTotal,
        groupOrder
      ),
    [vendors, query, matchingAuctions, maxTotal, groupOrder]
  );

  const flatSuggestions = useMemo(
    () => flattenSuggestions(suggestionGroups),
    [suggestionGroups]
  );

  return {
    vendors,
    vendorsLoading,
    queryReady,
    suggestionGroups,
    flatSuggestions,
  };
}
