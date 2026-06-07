"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import MessageContent from "@/components/messages/MessageContent";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";
import {
  confirmReceipt,
  formatOrderRef,
  getThreadDetail,
  getThreadThumbnail,
  markThreadMessagesRead,
  sendDirectMessage,
  type EnrichedDirectMessage,
  type ThreadDetail,
} from "@/lib/messages";
import { supabase } from "@/lib/supabase";
import { shortenAddress } from "@/lib/format";

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  isMine,
  showHeader,
  senderLabel,
  senderWallet,
  senderAvatar,
  onCopyTracking,
}: {
  message: EnrichedDirectMessage;
  isMine: boolean;
  showHeader: boolean;
  senderLabel: string;
  senderWallet: string;
  senderAvatar: string | null;
  onCopyTracking: (trackingNumber: string) => void;
}) {
  if (message.is_system) {
    return (
      <div className="flex justify-center py-2">
        <p className="max-w-md text-center text-xs italic text-muted">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      {!isMine && showHeader ? (
        <UserAvatar
          walletAddress={senderWallet}
          avatarUrl={senderAvatar}
          alt={senderLabel}
          size="xs"
          className="mt-1 shrink-0"
        />
      ) : (
        <div className="w-6 shrink-0" />
      )}
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        {showHeader && !isMine && (
          <p className="mb-1 text-xs font-medium text-zinc-400">{senderLabel}</p>
        )}
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isMine
              ? "bg-accent text-white"
              : "border border-border bg-surface-elevated text-zinc-200"
          }`}
        >
          <MessageContent
            content={message.content}
            isMine={isMine}
            onCopyTracking={onCopyTracking}
          />
        </div>
      </div>
    </div>
  );
}

export default function ThreadView({ threadId }: { threadId: string }) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { showToast } = useToast();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const wallet = publicKey?.toBase58();
  const isArchived = thread?.status === "archived";
  const isBuyer = wallet === thread?.buyer_wallet;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadThread = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const data = await getThreadDetail(threadId, wallet);
      if (!data) {
        router.replace("/messages");
        return;
      }
      setThread(data);
      await markThreadMessagesRead(threadId, wallet);
    } catch (error) {
      console.error("Failed to load thread:", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [threadId, wallet, router, showToast]);

  useEffect(() => {
    if (!connected || !wallet) {
      router.replace("/");
      return;
    }
    void loadThread();
  }, [connected, wallet, router, loadThread]);

  useEffect(() => {
    if (!wallet) return;

    const channel = supabase
      .channel(`direct_messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          void loadThread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, wallet, loadThread]);

  useEffect(() => {
    if (thread?.messages.length) scrollToBottom();
  }, [thread?.messages.length, scrollToBottom]);

  const handleSend = async () => {
    if (!wallet || !input.trim() || sending || isArchived) return;
    setSending(true);
    try {
      await sendDirectMessage(threadId, wallet, input);
      setInput("");
      await loadThread();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  };

  const handleCopyTracking = async (trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      showToast("Copied!");
    } catch {
      showToast("Failed to copy tracking number.", "error");
    }
  };

  const handleConfirmReceipt = async () => {
    if (!wallet || !isBuyer || confirming || thread?.confirmed_at) return;
    setConfirming(true);
    try {
      await confirmReceipt(threadId, wallet);
      showToast("Receipt confirmed.");
      await loadThread();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setConfirming(false);
    }
  };

  if (!connected || !wallet) return null;

  if (loading || !thread) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="py-12 text-center text-sm text-muted">
          Loading conversation...
        </p>
      </div>
    );
  }

  const title = thread.auction?.title ?? "General Inquiry";
  const thumb = getThreadThumbnail(thread.auction);
  const otherParty = isBuyer ? thread.seller : thread.buyer;
  const otherLabel =
    otherParty.username ??
    shortenAddress(otherParty.wallet_address, 6);

  const groupedMessages = thread.messages.map((message, index) => {
    const prev = thread.messages[index - 1];
    const showHeader =
      message.is_system ||
      !prev ||
      prev.is_system ||
      prev.sender_wallet !== message.sender_wallet;
    const showTimestamp =
      !thread.messages[index + 1] ||
      thread.messages[index + 1].sender_wallet !== message.sender_wallet ||
      thread.messages[index + 1].is_system;

    return { message, showHeader, showTimestamp };
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="shrink-0 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
            <Image src={thumb} alt={title} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">{title}</h1>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  isArchived
                    ? "bg-surface-elevated text-muted"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {isArchived ? "Archived" : "Active"}
              </span>
            </div>
            <p className="text-xs text-muted">
              {formatOrderRef(thread.auction_id)} · with {otherLabel}
            </p>
            {thread.auction?.reference_number && (
              <div className="mt-1.5">
                <ReferenceNumber referenceNumber={thread.auction.reference_number} />
              </div>
            )}
            {thread.auction_id && (
              <Link
                href={`/auction/${thread.auction_id}`}
                className="mt-1 inline-block text-xs font-medium text-accent hover:text-purple-300"
              >
                View auction →
              </Link>
            )}
          </div>
        </div>
      </div>

      {isArchived && (
        <div className="mt-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-center text-sm text-muted">
          This conversation has been archived.
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        {groupedMessages.map(({ message, showHeader, showTimestamp }) => {
          const isMine =
            !message.is_system && message.sender_wallet === wallet;
          const sender =
            message.sender_wallet === thread.buyer_wallet
              ? thread.buyer
              : thread.seller;
          const senderLabel =
            sender.username ??
            shortenAddress(sender.wallet_address, 6);

          return (
            <div key={message.id}>
              <MessageBubble
                message={message}
                isMine={isMine}
                showHeader={showHeader}
                senderLabel={senderLabel}
                senderWallet={message.sender_wallet}
                senderAvatar={sender.avatar_url}
                onCopyTracking={(trackingNumber) =>
                  void handleCopyTracking(trackingNumber)
                }
              />
              {showTimestamp && !message.is_system && (
                <p
                  className={`mt-1 text-[10px] text-muted ${
                    isMine ? "text-right" : "text-left pl-8"
                  }`}
                >
                  {formatMessageTime(message.created_at)}
                </p>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!isArchived && (
        <div className="mt-3 shrink-0 space-y-3">
          {isBuyer && thread.auction_id && (
            <button
              type="button"
              onClick={handleConfirmReceipt}
              disabled={Boolean(thread.confirmed_at) || confirming}
              className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {thread.confirmed_at
                ? "Receipt Confirmed ✓"
                : confirming
                  ? "Confirming..."
                  : "✓ Confirm Receipt"}
            </button>
          )}

          <div className="rounded-2xl border border-border bg-surface p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
              placeholder="Type a message..."
              disabled={sending}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-60"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
