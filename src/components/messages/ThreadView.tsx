"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

import AuctionSummaryTile from "@/components/messages/AuctionSummaryTile";
import MessageContent from "@/components/messages/MessageContent";
import { parseAuctionSummaryMessage } from "@/lib/auction-lifecycle";
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
import {
  checkWalletBalance,
  createEscrowProvider,
  getExplorerTxUrl,
  initiatePayment,
  PLATFORM_WALLET,
} from "@/lib/escrow";
import { shortenAddress } from "@/lib/format";

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getThreadStatusBadge(thread: ThreadDetail) {
  if (thread.status === "archived") {
    return {
      label: "Archived",
      className: "bg-surface-elevated text-muted",
    };
  }

  if (thread.confirmed_at) {
    return {
      label: "Receipt Confirmed ✓",
      className: "bg-emerald-500/20 text-emerald-300",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-500/20 text-emerald-300",
  };
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
  const messageContent = message.rawContent ?? message.content;
  const auctionSummary = parseAuctionSummaryMessage(messageContent);

  if (auctionSummary) {
    return (
      <div className="w-full overflow-visible py-2">
        <AuctionSummaryTile summary={auctionSummary} />
      </div>
    );
  }

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
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentTx, setPaymentTx] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const wallet = publicKey?.toBase58();
  const isArchived = thread?.status === "archived";
  const isBuyer = wallet === thread?.buyer_wallet;
  const statusBadge = thread ? getThreadStatusBadge(thread) : null;

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
      const provider =
        anchorWallet && connection
          ? createEscrowProvider(connection, anchorWallet)
          : undefined;
      const result = await confirmReceipt(
        threadId,
        wallet,
        thread?.auction && provider
          ? {
              provider,
              sellerWallet: thread.seller_wallet,
              platformWallet: PLATFORM_WALLET,
            }
          : undefined
      );
      if (result.onChainSuccess) {
        showToast("✅ Receipt confirmed on-chain");
      } else if (result.onChainWarning) {
        showToast(
          `Receipt saved. On-chain release failed: ${result.onChainWarning}`,
          "error"
        );
      } else {
        showToast("Receipt confirmed.");
      }
      await loadThread();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setConfirming(false);
    }
  };

  const handlePayNow = async () => {
    if (
      !wallet ||
      !anchorWallet ||
      !thread?.auction_id ||
      !thread.auction ||
      paying
    ) {
      return;
    }

    const bidAmount =
      thread.auction.current_bid > 0
        ? thread.auction.current_bid
        : thread.auction.start_price;

    setPaying(true);
    setPaymentError(null);

    try {
      const hasBalance = await checkWalletBalance(wallet, bidAmount);
      if (!hasBalance) {
        setPaymentError(
          `Insufficient SOL. You need at least ${(bidAmount + 0.01).toFixed(2)} SOL including fees.`
        );
        return;
      }

      const provider = createEscrowProvider(connection, anchorWallet);
      const result = await initiatePayment(
        thread.auction_id,
        anchorWallet,
        provider,
        bidAmount,
        0,
        thread.seller_wallet,
        PLATFORM_WALLET,
        thread.auction.escrow_attempt_number || 1
      );

      if (!result.success) {
        setPaymentError(result.error);
        return;
      }

      setPaymentTx(result.txSignature);
      showToast("✅ Payment confirmed! SOL locked in escrow.");
      await loadThread();
    } catch (error) {
      setPaymentError(getErrorMessage(error));
    } finally {
      setPaying(false);
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

  const escrowState = thread.auction?.escrow_state;
  const winnerWallet = thread.top_bidder_wallet ?? thread.buyer_wallet;
  const isAuctionWinner = Boolean(wallet) && wallet === winnerWallet;
  const needsEscrowPayment =
    !escrowState || escrowState === "none" || escrowState === "pending";

  const showPayNow =
    isAuctionWinner &&
    Boolean(thread.auction_id) &&
    Boolean(thread.auction) &&
    thread.auction?.status === "ended" &&
    needsEscrowPayment;

  const showConfirmReceipt =
    isBuyer &&
    Boolean(thread.auction_id) &&
    !showPayNow &&
    (escrowState === "shipped" ||
      ((!escrowState || escrowState === "none") && !thread.confirmed_at));

  const paymentSecured = ["funded", "shipped", "complete", "disputed"].includes(
    escrowState ?? ""
  );

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
              {statusBadge && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              )}
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
          {showPayNow && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void handlePayNow()}
                disabled={paying}
                className="w-full rounded-full bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? "Processing payment..." : "Pay Now"}
              </button>
              {paymentError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  <p>{paymentError}</p>
                  <button
                    type="button"
                    onClick={() => void handlePayNow()}
                    className="mt-2 text-xs font-semibold text-white underline"
                  >
                    Retry payment
                  </button>
                </div>
              )}
            </div>
          )}

          {paymentSecured && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              ✅ Payment secured in escrow
              {(paymentTx || thread.auction?.escrow_tx_signature) && (
                <a
                  href={getExplorerTxUrl(
                    paymentTx ?? thread.auction!.escrow_tx_signature!
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-xs font-medium text-purple-300 hover:text-purple-200"
                >
                  View on Solana Explorer →
                </a>
              )}
            </div>
          )}

          {(showConfirmReceipt || thread.confirmed_at) && (
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
