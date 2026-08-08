"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { adminActionButtonClass } from "@/components/admin/admin-button-styles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  issueBuyerStrike,
  liftBuyerRestrictions,
  sendAdminNotification,
  type StrikeAction,
} from "@/lib/admin/actions";
import type { AdminUserProfile, BuyerStrikeRow, RecentUserRow } from "@/lib/admin/types";
import { shortenAddress } from "@/lib/format";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

function statusBadge(status: AdminUserProfile["status"]) {
  switch (status) {
    case "banned":
      return "bg-red-500/15 text-red-300";
    case "suspended":
      return "bg-amber-500/15 text-amber-300";
    case "warned":
      return "bg-yellow-500/15 text-yellow-300";
    default:
      return "bg-emerald-500/15 text-emerald-300";
  }
}

export default function AdminUserManagement() {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [strikes, setStrikes] = useState<BuyerStrikeRow[]>([]);
  const [recent, setRecent] = useState<RecentUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardTab, setCardTab] = useState<"listings" | "purchases" | "reviews" | "strikes">("listings");
  const [pendingAction, setPendingAction] = useState<StrikeAction | "lift" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function adminUsersFetch(params: string) {
    const wallet = publicKey?.toBase58();
    if (!wallet) return null;
    const response = await fetch(`/api/admin/users?${params}`, {
      headers: {
        "x-wallet-address": wallet,
        ...getWalletAuthHeaders(),
      },
    });
    if (!response.ok) return null;
    return response.json();
  }

  async function fetchRecentUsersViaApi() {
    return (await adminUsersFetch("action=recent")) ?? [];
  }

  async function searchAdminUserViaApi(query: string) {
    return await adminUsersFetch(`action=search&query=${encodeURIComponent(query)}`);
  }

  async function fetchUserStrikesViaApi(wallet: string) {
    return (await adminUsersFetch(`action=strikes&wallet=${encodeURIComponent(wallet)}`)) ?? [];
  }

  useEffect(() => {
    void fetchRecentUsersViaApi().then((rows) => {
      setRecent(rows as RecentUserRow[]);
    });
  }, [publicKey]);

  const runSearch = useCallback(async () => {
    if (!query.trim()) {
      setUser(null);
      return;
    }
    setLoading(true);
    try {
      const found = (await searchAdminUserViaApi(query)) as AdminUserProfile | null;
      setUser(found);
      if (found) {
        setStrikes(
          (await fetchUserStrikesViaApi(found.wallet_address)) as BuyerStrikeRow[]
        );
      }
    } finally {
      setLoading(false);
    }
  }, [query, publicKey]);

  const executeAction = async () => {
    if (!user || !pendingAction) return;
    setActionLoading(true);
    try {
      if (pendingAction === "lift") {
        await liftBuyerRestrictions(user.wallet_address, client);
        showToast("Restrictions lifted.");
      } else {
        await issueBuyerStrike(user.wallet_address, pendingAction, null, client);
        await sendAdminNotification(
          user.wallet_address,
          "Account notice",
          `A platform ${pendingAction.replace(/_/g, " ")} has been applied to your account.`,
          "/profile"
        );
        showToast("Action applied.");
      }
      setStrikes(
        (await fetchUserStrikesViaApi(user.wallet_address)) as BuyerStrikeRow[]
      );
      const refreshed = (await searchAdminUserViaApi(
        user.wallet_address
      )) as AdminUserProfile | null;
      if (refreshed) setUser(refreshed);
    } catch (err) {
      logSupabaseError("AdminUserManagement.action", err);
      showToast(getErrorMessage(err, "Action failed."), "error");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const actionLabels: Record<StrikeAction | "lift", string> = {
    warning: "Issue Warning",
    cooldown_24h: "24h Cooldown",
    suspension_7d: "7-day Suspension",
    ban: "Permanent Ban",
    lift: "Lift Restriction",
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="Search wallet or username..."
          className="flex-1 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm text-white outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          className={adminActionButtonClass.search}
        >
          Search
        </button>
      </div>

      {loading && <div className="h-32 animate-pulse rounded-xl bg-surface" />}

      {user && !loading && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start gap-4">
            <UserAvatar
              walletAddress={user.wallet_address}
              avatarUrl={user.avatar_url}
              alt={user.username ?? "User"}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {user.username ? `@${user.username}` : shortenAddress(user.wallet_address, 6)}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadge(user.status)}`}>
                  {user.status}
                </span>
              </div>
              <p className="font-mono text-xs text-muted">{user.wallet_address}</p>
              <p className="mt-1 text-xs text-muted">
                Joined {new Date(user.created_at).toLocaleDateString()}
                {user.country ? ` · ${user.country}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <p>Listings: {user.listingsCount}</p>
                <p>Sales: {user.salesCount}</p>
                <p>Purchases: {user.purchasesCount}</p>
                <p>Reviews: {user.reviewsCount}</p>
                <p>Rating: {user.average_rating.toFixed(1)}</p>
                <p>Strikes: {user.strikeCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["warning", "cooldown_24h", "suspension_7d", "ban", "lift"] as const).map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setPendingAction(action)}
                className={
                  action === "ban"
                    ? adminActionButtonClass.ban
                    : action === "lift"
                      ? adminActionButtonClass.lift
                      : action === "warning"
                        ? adminActionButtonClass.warning
                        : action === "cooldown_24h"
                          ? adminActionButtonClass.cooldown
                          : adminActionButtonClass.suspension
                }
              >
                {actionLabels[action]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2 border-b border-border pb-1">
            {(["listings", "purchases", "reviews", "strikes"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCardTab(t)}
                className={`rounded-t-lg px-3 py-1.5 text-xs capitalize ${
                  cardTab === t ? "border-b-2 border-accent text-white" : "text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-muted">
            {cardTab === "strikes" ? (
              strikes.length ? (
                <ul className="space-y-2">
                  {strikes.map((s) => (
                    <li key={s.id} className="rounded-lg bg-background/60 px-3 py-2">
                      <span className="text-white">{s.reason}</span> —{" "}
                      {new Date(s.created_at).toLocaleString()}
                      {s.expires_at && (
                        <span> · expires {new Date(s.expires_at).toLocaleDateString()}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No strikes on record.</p>
              )
            ) : (
              <p>
                {cardTab === "listings" && `${user.listingsCount} total listings`}
                {cardTab === "purchases" && `${user.purchasesCount} winning bids`}
                {cardTab === "reviews" && `${user.reviewsCount} reviews given/received`}
              </p>
            )}
          </div>
        </div>
      )}

      {!user && !loading && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-white">Recent users</h3>
          <div className="space-y-2">
            {recent.map((u) => (
              <button
                key={u.wallet}
                type="button"
                onClick={() => {
                  setQuery(u.username ?? u.wallet);
                  void searchAdminUserViaApi(u.username ?? u.wallet).then((found) => {
                    const profile = found as AdminUserProfile | null;
                    if (profile) {
                      setUser(profile);
                      void fetchUserStrikesViaApi(profile.wallet_address).then((rows) => {
                        setStrikes(rows as BuyerStrikeRow[]);
                      });
                    }
                  });
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-xs hover:border-accent/40"
              >
                <UserAvatar walletAddress={u.wallet} avatarUrl={u.avatarUrl} alt="" size="sm" />
                <div className="flex-1">
                  <p className="text-white">{u.username ? `@${u.username}` : shortenAddress(u.wallet, 4)}</p>
                  <p className="text-muted">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 capitalize ${statusBadge(u.status)}`}>
                  {u.status}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction ? actionLabels[pendingAction] : ""}
        message={
          user && pendingAction
            ? `Apply "${actionLabels[pendingAction]}" to ${user.username ?? shortenAddress(user.wallet_address, 4)}?`
            : ""
        }
        confirmLabel="Confirm"
        confirmClassName={
          pendingAction === "ban" ? "bg-red-600 hover:bg-red-500" : "bg-accent hover:bg-accent-hover"
        }
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void executeAction()}
      />
    </div>
  );
}
