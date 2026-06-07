"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import UserAvatar from "@/components/ui/UserAvatar";
import {
  formatOrderRef,
  getThreadThumbnail,
  getThreadsForWallet,
  type MessagesTab,
  type ThreadListItem,
} from "@/lib/messages";
import { shortenAddress } from "@/lib/format";

const tabs: { id: MessagesTab; label: string }[] = [
  { id: "buying", label: "Buying" },
  { id: "selling", label: "Selling" },
  { id: "archived", label: "Archived" },
];

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ThreadRow({ thread }: { thread: ThreadListItem }) {
  const title = thread.auction?.title ?? "General Inquiry";
  const thumb = getThreadThumbnail(
    thread.auction
      ? {
          title: thread.auction.title,
          image_url: thread.auction.image_url,
          category: null,
        }
      : null
  );
  const otherName =
    thread.other_party.username ??
    shortenAddress(thread.other_party.wallet_address, 6);
  const preview = thread.last_message?.content ?? "No messages yet";
  const time = thread.last_message?.created_at ?? thread.created_at;

  return (
    <Link
      href={`/messages/${thread.id}`}
      className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
        <Image
          src={thumb}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-muted">
              {formatOrderRef(thread.auction_id)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[11px] text-muted">
              {formatRelativeTime(time)}
            </span>
            {thread.status === "archived" && (
              <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                Archived
              </span>
            )}
            {thread.unread_count > 0 && (
              <span className="rounded-full bg-live-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                {thread.unread_count}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <UserAvatar
            walletAddress={thread.other_party.wallet_address}
            avatarUrl={thread.other_party.avatar_url}
            alt={otherName}
            size="xs"
          />
          <p className="truncate text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">{otherName}:</span>{" "}
            {preview.length > 50 ? `${preview.slice(0, 50)}…` : preview}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function MessagesView() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<MessagesTab>("buying");
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const data = await getThreadsForWallet(
        publicKey.toBase58(),
        activeTab
      );
      setThreads(data);
    } catch (error) {
      console.error("Failed to load message threads:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, activeTab]);

  useEffect(() => {
    if (!connected || !publicKey) {
      router.replace("/");
      return;
    }
    void loadThreads();
  }, [connected, publicKey, router, loadThreads]);

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Private conversations with buyers and sellers
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-accent text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">Loading threads...</p>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">
            {activeTab === "buying" && "No active buying conversations yet."}
            {activeTab === "selling" && "No active selling conversations yet."}
            {activeTab === "archived" && "No archived conversations."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
