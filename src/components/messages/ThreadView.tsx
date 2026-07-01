"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

import AuctionSummaryTile from "@/components/messages/AuctionSummaryTile";
import MessageContent from "@/components/messages/MessageContent";
import NextBidderOfferTile from "@/components/messages/NextBidderOfferTile";
import UploadTrackingCard from "@/components/messages/UploadTrackingCard";
import { parseAuctionSummaryMessage } from "@/lib/auction-lifecycle";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
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
import {
  isShippingExemptAuction,
  resolveShippingUsd,
} from "@/lib/auction-shipping";
import {
  calculatePaymentBreakdown,
  checkWalletBalance,
  createEscrowProvider,
  getExplorerTxUrl,
  initiatePayment,
  PLATFORM_WALLET,
  type PaymentBreakdown,
} from "@/lib/escrow";
import { formatSol, shortenAddress } from "@/lib/format";
import { createSolanaConnection } from "@/lib/solana-config";
import { getEffectiveBid } from "@/lib/parse-auction";
import {
  acceptNextBidderOffer,
  canRespondToNextBidderOffer,
  declineNextBidderOffer,
  parseNextBidderOfferMessage,
  type NextBidderOfferPayload,
} from "@/lib/non-payment-resolution";
import { getDefaultShippingAddress } from "@/lib/shipping";

function getLatestOfferForWallet(
  messages: EnrichedDirectMessage[],
  bidderWallet: string
): NextBidderOfferPayload | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const offer = parseNextBidderOfferMessage(
      message.rawContent ?? message.content
    );
    if (offer && offer.bidder_wallet === bidderWallet) {
      return offer;
    }
  }
  return null;
}

function getLatestRespondableOfferMessageId(
  messages: EnrichedDirectMessage[],
  auction: ThreadDetail["auction"],
  viewerWallet: string
): string | null {
  if (!auction) return null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const offer = parseNextBidderOfferMessage(
      message.rawContent ?? message.content
    );
    if (
      offer &&
      canRespondToNextBidderOffer({
        auction,
        viewerWallet,
        offer,
      })
    ) {
      return message.id;
    }
  }

  return null;
}

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
  canRespondToOffer,
  onAcceptOffer,
  onDeclineOffer,
  offerLoading,
}: {
  message: EnrichedDirectMessage;
  isMine: boolean;
  showHeader: boolean;
  senderLabel: string;
  senderWallet: string;
  senderAvatar: string | null;
  onCopyTracking: (trackingNumber: string) => void;
  canRespondToOffer?: boolean;
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  offerLoading?: boolean;
}) {
  const messageContent = message.rawContent ?? message.content;
  const auctionSummary = parseAuctionSummaryMessage(messageContent);
  const nextBidderOffer = parseNextBidderOfferMessage(messageContent);

  if (auctionSummary) {
    return (
      <div className="w-full overflow-visible py-2">
        <AuctionSummaryTile summary={auctionSummary} />
      </div>
    );
  }

  if (nextBidderOffer) {
    return (
      <div className="w-full overflow-visible py-2">
        <NextBidderOfferTile
          offer={nextBidderOffer}
          canRespond={Boolean(canRespondToOffer)}
          loading={offerLoading}
          onAccept={() => onAcceptOffer?.()}
          onDecline={() => onDeclineOffer?.()}
        />
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
  const { client } = useSupabaseClient();
  const anchorWallet = useAnchorWallet();
  const connection = useMemo(() => createSolanaConnection(), []);
  const { showToast } = useToast();
  const { refresh: refreshUnreadCount } = useUnreadMessageCount();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentTx, setPaymentTx] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] =
    useState<PaymentBreakdown | null>(null);
  const [offerResponding, setOfferResponding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const wallet = publicKey?.toBase58();
  const isArchived = thread?.status === "archived";
  const isBuyer = wallet === thread?.buyer_wallet;
  const isSeller = wallet === thread?.seller_wallet;
  const statusBadge = thread ? getThreadStatusBadge(thread) : null;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadThread = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const data = await getThreadDetail(threadId, wallet, client);
      if (!data) {
        router.replace("/messages");
        return;
      }
      setThread(data);
      await markThreadMessagesRead(threadId, wallet, client);
      void refreshUnreadCount();
    } catch (error) {
      console.error("Failed to load thread:", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [client, threadId, wallet, router, showToast, refreshUnreadCount]);

  useEffect(() => {
    if (!connected || !wallet) {
      router.replace("/");
      return;
    }
    void loadThread();
  }, [connected, wallet, router, loadThread]);

  useEffect(() => {
    if (!thread?.auction || !wallet || thread.auction.status !== "ended") {
      setPaymentBreakdown(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const auction = thread.auction!;
        const latestOffer = getLatestOfferForWallet(thread.messages, wallet);
        const bidAmount =
          latestOffer?.status === "accepted"
            ? latestOffer.amount_sol
            : getEffectiveBid(auction);
        const { data: seller } = await client
          .from("users")
          .select("country, ships_internationally")
          .eq("wallet_address", thread.seller_wallet)
          .maybeSingle();
        const defaultAddress = await getDefaultShippingAddress(wallet, client).catch(
          () => null
        );
        const isExempt = isShippingExemptAuction(auction);
        const shippingUsd =
          resolveShippingUsd({
            domesticShippingUsd: auction.domestic_shipping_usd,
            internationalShippingUsd: auction.international_shipping_usd,
            sellerCountry: (seller?.country as string | null) ?? null,
            buyerCountry: defaultAddress?.country ?? null,
            shipsInternationally: Boolean(seller?.ships_internationally),
            isExempt,
          }) ?? 0;
        const breakdown = await calculatePaymentBreakdown(bidAmount, shippingUsd);
        if (!cancelled) setPaymentBreakdown(breakdown);
      } catch {
        if (!cancelled) setPaymentBreakdown(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, thread, wallet]);

  useEffect(() => {
    if (!wallet) return;

    const channel = client
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
      client.removeChannel(channel);
    };
  }, [client, threadId, wallet, loadThread]);

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

    if (thread?.auction_id && !anchorWallet) {
      showToast("Connect your wallet to confirm receipt on-chain.", "error");
      return;
    }

    setConfirming(true);
    try {
      const provider =
        anchorWallet && connection
          ? createEscrowProvider(connection, anchorWallet)
          : undefined;
      const result = await confirmReceipt(
        threadId,
        wallet,
        thread?.auction_id && provider
          ? {
              provider,
              sellerWallet: thread.seller_wallet,
              platformWallet: PLATFORM_WALLET,
            }
          : undefined,
        client
      );
      showToast(
        result.onChainSuccess
          ? "✅ Receipt confirmed on-chain"
          : "Receipt confirmed."
      );
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

    const latestOffer = thread
      ? getLatestOfferForWallet(thread.messages, wallet)
      : null;
    const bidAmount =
      latestOffer?.status === "accepted"
        ? latestOffer.amount_sol
        : getEffectiveBid(thread.auction);

    setPaying(true);
    setPaymentError(null);

    try {
      const { data: seller } = await client
        .from("users")
        .select("country, ships_internationally")
        .eq("wallet_address", thread.seller_wallet)
        .maybeSingle();
      const defaultAddress = await getDefaultShippingAddress(wallet, client).catch(
        () => null
      );
      const isExempt = isShippingExemptAuction(thread.auction);
      const shippingUsd =
        resolveShippingUsd({
          domesticShippingUsd: thread.auction.domestic_shipping_usd,
          internationalShippingUsd: thread.auction.international_shipping_usd,
          sellerCountry: (seller?.country as string | null) ?? null,
          buyerCountry: defaultAddress?.country ?? null,
          shipsInternationally: Boolean(seller?.ships_internationally),
          isExempt,
        }) ?? 0;

      const breakdown =
        paymentBreakdown ??
        (await calculatePaymentBreakdown(bidAmount, shippingUsd));

      const hasBalance = await checkWalletBalance(wallet, breakdown.totalSol);
      if (!hasBalance) {
        setPaymentError(
          `Insufficient SOL. You need at least ${(breakdown.totalSol + 0.01).toFixed(2)} SOL including fees.`
        );
        return;
      }

      const provider = createEscrowProvider(connection, anchorWallet);
      const result = await initiatePayment(
        thread.auction_id,
        anchorWallet,
        provider,
        bidAmount,
        shippingUsd,
        thread.seller_wallet,
        PLATFORM_WALLET,
        thread.auction.escrow_attempt_number || 1
      );

      if (!result.success) {
        setPaymentError(
          getErrorMessage(result.error, "Unable to process payment. Please try again.")
        );
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

  const handleAcceptAndPay = async () => {
    if (
      !wallet ||
      !anchorWallet ||
      !thread?.auction_id ||
      !thread.auction ||
      offerResponding ||
      paying
    ) {
      return;
    }

    setOfferResponding(true);
    setPaymentError(null);

    try {
      const latestOffer = getLatestOfferForWallet(thread.messages, wallet);
      const bidAmount =
        latestOffer?.amount_sol ?? getEffectiveBid(thread.auction);

      await acceptNextBidderOffer({
        auctionId: thread.auction_id,
        bidderWallet: wallet,
        threadId,
      });

      const { data: seller } = await client
        .from("users")
        .select("country, ships_internationally")
        .eq("wallet_address", thread.seller_wallet)
        .maybeSingle();
      const defaultAddress = await getDefaultShippingAddress(wallet, client).catch(
        () => null
      );
      const isExempt = isShippingExemptAuction(thread.auction);
      const shippingUsd =
        resolveShippingUsd({
          domesticShippingUsd: thread.auction.domestic_shipping_usd,
          internationalShippingUsd: thread.auction.international_shipping_usd,
          sellerCountry: (seller?.country as string | null) ?? null,
          buyerCountry: defaultAddress?.country ?? null,
          shipsInternationally: Boolean(seller?.ships_internationally),
          isExempt,
        }) ?? 0;

      const breakdown = await calculatePaymentBreakdown(bidAmount, shippingUsd);

      const hasBalance = await checkWalletBalance(wallet, breakdown.totalSol);
      if (!hasBalance) {
        setPaymentError(
          `Insufficient SOL. You need at least ${(breakdown.totalSol + 0.01).toFixed(2)} SOL including fees.`
        );
        showToast("Offer accepted. Add funds and use Pay Now below.", "error");
        await loadThread();
        return;
      }

      setOfferResponding(false);
      setPaying(true);

      const provider = createEscrowProvider(connection, anchorWallet);
      const result = await initiatePayment(
        thread.auction_id,
        anchorWallet,
        provider,
        bidAmount,
        shippingUsd,
        thread.seller_wallet,
        PLATFORM_WALLET,
        thread.auction.escrow_attempt_number || 1
      );

      if (!result.success) {
        setPaymentError(
          getErrorMessage(result.error, "Unable to process payment. Please try again.")
        );
        showToast("Offer accepted. Complete payment with Pay Now below.");
        await loadThread();
        return;
      }

      setPaymentTx(result.txSignature);
      showToast("✅ Offer accepted and payment secured in escrow!");
      await loadThread();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setOfferResponding(false);
      setPaying(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!wallet || !thread?.auction_id || offerResponding) return;
    setOfferResponding(true);
    try {
      await declineNextBidderOffer({
        auctionId: thread.auction_id,
        bidderWallet: wallet,
        threadId,
      });
      showToast("Offer declined.");
      await loadThread();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setOfferResponding(false);
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

  const escrowState =
    thread.escrow_status ?? thread.auction?.escrow_state ?? null;
  const hasUploadedTracking = Boolean(
    thread.tracking_number?.trim() || thread.auction?.tracking_number?.trim()
  );
  const needsEscrowPayment =
    !escrowState || escrowState === "none" || escrowState === "pending";

  const latestOffer =
    wallet && thread
      ? getLatestOfferForWallet(thread.messages, wallet)
      : null;
  const isNextBidderBuyer =
    thread?.auction?.next_bidder_wallet === thread?.buyer_wallet &&
    thread.buyer_wallet === wallet;
  const isOriginalWinner =
    Boolean(wallet) &&
    wallet === (thread?.top_bidder_wallet ?? thread?.buyer_wallet) &&
    !thread?.auction?.next_bidder_wallet;
  const canPayAsBuyer =
    Boolean(isBuyer) &&
    Boolean(thread?.auction_id) &&
    Boolean(thread?.auction) &&
    thread.auction?.status === "ended" &&
    needsEscrowPayment &&
    (isOriginalWinner ||
      (isNextBidderBuyer && latestOffer?.status === "accepted"));

  const showPayNow = canPayAsBuyer;

  const showConfirmReceipt =
    isBuyer &&
    Boolean(thread.auction_id) &&
    !showPayNow &&
    !thread.confirmed_at &&
    escrowState === "shipped";

  const paymentSecured = ["funded", "shipped", "complete", "disputed"].includes(
    escrowState ?? ""
  );

  const showUploadTracking =
    isSeller &&
    Boolean(thread.auction_id) &&
    escrowState === "funded" &&
    !hasUploadedTracking;

  const showShippedConfirmation =
    isSeller &&
    Boolean(thread.auction_id) &&
    (escrowState === "shipped" || hasUploadedTracking);

  const respondableOfferMessageId =
    wallet && thread.auction
      ? getLatestRespondableOfferMessageId(
          thread.messages,
          thread.auction,
          wallet
        )
      : null;

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
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col sm:h-[calc(100vh-8rem)]">
      <div className="shrink-0 rounded-2xl border border-border bg-surface p-3 sm:p-3">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated sm:block">
            <Image src={thumb} alt={title} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-white sm:text-lg">{title}</h1>
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
              <div className="mt-1 sm:mt-1.5">
                <ReferenceNumber referenceNumber={thread.auction.reference_number} />
              </div>
            )}
            {thread.auction_id && (
              <Link
                href={`/auction/${thread.auction_id}`}
                className="mt-1 hidden text-xs font-medium text-accent hover:text-purple-300 sm:inline-block"
              >
                View auction →
              </Link>
            )}
          </div>
        </div>
      </div>

      {isArchived && (
        <div className="mt-2 shrink-0 rounded-xl border border-border bg-background/60 px-4 py-2 text-center text-sm text-muted sm:mt-3 sm:py-3">
          This conversation has been archived.
        </div>
      )}

      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:mt-3">
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 sm:space-y-3">
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
                canRespondToOffer={message.id === respondableOfferMessageId}
                onAcceptOffer={() => void handleAcceptAndPay()}
                onDeclineOffer={() => void handleDeclineOffer()}
                offerLoading={offerResponding || paying}
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
      </div>

      {!isArchived && (
        <div className="mt-2 shrink-0 space-y-2 border-t border-border bg-background pt-2 sm:mt-3 sm:space-y-3 sm:border-t-0 sm:bg-transparent sm:pt-0">
          {showUploadTracking && thread.auction_id && (
            <UploadTrackingCard
              threadId={thread.id}
              auctionId={thread.auction_id}
              sellerWallet={thread.seller_wallet}
              escrowPda={thread.auction?.escrow_pda ?? null}
              amountLamports={thread.auction?.escrow_amount_lamports ?? 0}
              onSubmitted={() => void loadThread()}
            />
          )}

          {showShippedConfirmation && !showUploadTracking && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              Mark as Shipped ✅
              {(thread.tracking_number || thread.auction?.tracking_number) &&
                (thread.carrier || thread.auction?.tracking_courier) && (
                <p className="mt-1 text-xs font-normal text-emerald-100/90">
                  {thread.tracking_number ?? thread.auction?.tracking_number} via{" "}
                  {thread.carrier ?? thread.auction?.tracking_courier}
                </p>
              )}
            </div>
          )}

          {showPayNow && (
            <div className="space-y-2">
              {paymentBreakdown && (
                <div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-zinc-300">
                  Item: {formatSol(paymentBreakdown.itemSol)} + Shipping:{" "}
                  {formatSol(paymentBreakdown.shippingSol)} = Total:{" "}
                  {formatSol(paymentBreakdown.totalSol)}
                </div>
              )}
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

          <div className="rounded-2xl border border-border bg-surface p-2.5 sm:p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-60 sm:min-h-[2.75rem] sm:flex-1"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="w-full rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto sm:shrink-0"
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
