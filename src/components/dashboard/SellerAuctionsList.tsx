"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import type { Auction, AuctionStatus } from "@/lib/database.types";
import { formatSol, formatTimeLeft } from "@/lib/format";
import { getSellerAuctions } from "@/lib/seller";

const statusStyles: Record<AuctionStatus, string> = {
  live: "bg-live-red/20 text-live-red",
  draft: "bg-zinc-500/20 text-zinc-400",
  ended: "bg-zinc-700/40 text-zinc-500",
  cancelled: "bg-zinc-700/40 text-zinc-500",
};

export default function SellerAuctionsList({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { publicKey } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!publicKey) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getSellerAuctions(publicKey.toBase58());
        if (!cancelled) setAuctions(data);
      } catch (error) {
        logSupabaseError("SellerAuctionsList", error);
        if (!cancelled) setAuctions([]);
        console.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [publicKey, refreshKey]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-white">Your Auctions</h2>
      <p className="mt-1 text-sm text-muted">
        Track your active and past listings.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading auctions...</p>
      ) : auctions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
          No auctions yet. Create your first listing above.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Current bid</th>
                <th className="pb-3 pr-4 font-medium">Time left</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => {
                const displayBid =
                  auction.current_bid > 0
                    ? auction.current_bid
                    : auction.start_price;

                return (
                  <tr
                    key={auction.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-3.5 pr-4 font-medium text-white">
                      {auction.title}
                    </td>
                    <td className="py-3.5 pr-4 text-accent">
                      {formatSol(displayBid)}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-zinc-300">
                      {auction.status === "live"
                        ? formatTimeLeft(auction.end_time)
                        : "—"}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[auction.status]}`}
                      >
                        {auction.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
