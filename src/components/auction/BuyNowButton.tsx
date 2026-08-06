"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import ThreadShippingAddressModal from "@/components/messages/ThreadShippingAddressModal";
import FiatValue from "@/components/ui/FiatValue";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { verifyBuyNowPaymentShipping } from "@/lib/buy-now";
import { isShippingExemptAuction } from "@/lib/auction-shipping";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import {
  calculatePaymentBreakdown,
  checkWalletBalance,
  createEscrowProvider,
  initiatePayment,
  PLATFORM_WALLET,
  type PaymentBreakdown,
} from "@/lib/escrow";
import { postPaymentSecuredNotifications } from "@/lib/payment-notifications-client";
import { formatSol } from "@/lib/format";
import {
  getBuyNowPrice,
  hasBuyNowOption,
  isFixedPriceListing,
  isListingLive,
} from "@/lib/listing-types";
import { createSolanaConnection } from "@/lib/solana-config";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

async function verifyBuyNowOnServer(
  auctionId: string,
  buyerWallet: string
): Promise<void> {
  const response = await fetch("/api/auctions/buy-now/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getWalletAuthHeaders(),
    },
    body: JSON.stringify({ auctionId, buyerWallet }),
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "This item is no longer available.");
  }
}

async function completeBuyNowOnServer(
  auctionId: string,
  buyerWallet: string,
  threadId: string
): Promise<void> {
  const response = await fetch("/api/auctions/buy-now", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getWalletAuthHeaders(),
    },
    body: JSON.stringify({
      action: "complete",
      auctionId,
      buyerWallet,
      threadId,
    }),
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to finalize purchase.");
  }
}

export default function BuyNowButton({
  auction,
  sellerCountry,
  shipsInternationally,
  variant = "detail",
  className = "",
}: {
  auction: Auction;
  sellerCountry?: string | null;
  shipsInternationally?: boolean;
  variant?: "detail" | "card";
  className?: string;
}) {
  const { client } = useSupabaseClient();
  const router = useRouter();
  const { showToast } = useToast();
  const connectPhantom = usePhantomConnect();
  const anchorWallet = useAnchorWallet();
  const connection = useMemo(() => createSolanaConnection(), []);
  const payInFlightRef = useRef(false);

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState("");
  const [paymentBreakdown, setPaymentBreakdown] =
    useState<PaymentBreakdown | null>(null);

  const wallet = anchorWallet?.publicKey?.toBase58() ?? null;
  const buyNowPrice = getBuyNowPrice(auction);
  const visible =
    hasBuyNowOption(auction) &&
    buyNowPrice != null &&
    buyNowPrice > 0 &&
    isListingLive(auction) &&
    wallet !== auction.seller_wallet;

  const isExempt = isShippingExemptAuction(auction);

  const handleConnect = async () => {
    try {
      await connectPhantom();
    } catch {
      // declined
    }
  };

  const openBuyFlow = async () => {
    if (!wallet || !visible || paying || payInFlightRef.current) return;

    setPaymentError(null);
    try {
      await verifyBuyNowOnServer(auction.id, wallet);
      setShowShippingModal(true);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleShippingConfirmed = useCallback(
    async ({
      shippingUsd,
      threadId: confirmedThreadId,
    }: {
      shippingUsd: number;
      shippingCountry: string;
      addressId: string;
      threadId?: string;
    }) => {
      if (!wallet || !buyNowPrice) return;

      setShowShippingModal(false);

      const resolvedThreadId = confirmedThreadId ?? "";
      setThreadId(resolvedThreadId);

      if (!anchorWallet) {
        showToast("Connect your wallet to continue.", "error");
        return;
      }

      payInFlightRef.current = true;
      setPaying(true);
      setPaymentError(null);

      try {
        await verifyBuyNowOnServer(auction.id, wallet);

        const breakdown = await calculatePaymentBreakdown(buyNowPrice, shippingUsd);
        setPaymentBreakdown(breakdown);

        const hasBalance = await checkWalletBalance(wallet, breakdown.totalSol);
        if (!hasBalance) {
          setPaymentError(
            `Insufficient SOL. You need at least ${(breakdown.totalSol + 0.01).toFixed(2)} SOL including fees.`
          );
          return;
        }

        const provider = createEscrowProvider(connection, anchorWallet);
        const result = await initiatePayment(
          auction.id,
          anchorWallet,
          provider,
          buyNowPrice,
          shippingUsd,
          auction.seller_wallet,
          PLATFORM_WALLET,
          auction.escrow_attempt_number || 1,
          resolvedThreadId,
          client
        );

        if (!result.success) {
          setPaymentError(
            getErrorMessage(result.error, "Unable to process payment. Please try again.")
          );
          return;
        }

        try {
          await postPaymentSecuredNotifications({
            auctionId: auction.id,
            buyerWallet: wallet,
            threadId: resolvedThreadId,
            totalSol: breakdown.totalSol,
          });
        } catch (notifyError) {
          console.error("BuyNowButton: payment secured notifications failed", notifyError);
        }

        await completeBuyNowOnServer(auction.id, wallet, resolvedThreadId);
        showToast("✅ Purchase complete! Payment secured in escrow.");
        router.refresh();
        if (resolvedThreadId) {
          router.push(`/messages/${resolvedThreadId}`);
        }
      } catch (error) {
        setPaymentError(getErrorMessage(error));
        showToast(getErrorMessage(error), "error");
      } finally {
        payInFlightRef.current = false;
        setPaying(false);
      }
    },
    [
      anchorWallet,
      auction,
      buyNowPrice,
      connection,
      router,
      showToast,
      wallet,
    ]
  );

  useEffect(() => {
    if (!wallet || !threadId || !buyNowPrice) {
      setPaymentBreakdown(null);
      return;
    }
    let cancelled = false;
    void verifyBuyNowPaymentShipping({
      auctionId: auction.id,
      buyerWallet: wallet,
    })
      .then(({ shippingUsd }) =>
        calculatePaymentBreakdown(buyNowPrice, shippingUsd)
      )
      .then((breakdown) => {
        if (!cancelled) setPaymentBreakdown(breakdown);
      })
      .catch(() => {
        if (!cancelled) setPaymentBreakdown(null);
      });
    return () => {
      cancelled = true;
    };
  }, [auction.id, buyNowPrice, threadId, wallet]);

  if (!visible) return null;

  const label = `Buy Now — ${formatSol(buyNowPrice!)}`;

  const buttonClass =
    variant === "card"
      ? "mt-2 w-full rounded-full bg-amber-500/20 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
      : "w-full rounded-full bg-amber-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      {!wallet ? (
        <button
          type="button"
          onClick={() => void handleConnect()}
          className={`${buttonClass} ${className}`.trim()}
        >
          Connect Wallet to Buy
        </button>
      ) : (
        <div className={className}>
          <button
            type="button"
            onClick={() => void openBuyFlow()}
            disabled={paying}
            className={buttonClass}
          >
            {paying ? "Processing..." : label}
          </button>
          {variant === "detail" && !isFixedPriceListing(auction) && (
            <p className="mt-2 text-center text-xs text-muted">
              Buy instantly and end the auction
            </p>
          )}
          {variant === "detail" && buyNowPrice != null && (
            <p className="mt-1 text-center text-sm text-muted">
              <FiatValue solAmount={buyNowPrice} />
            </p>
          )}
          {paymentError && (
            <p className="mt-2 text-center text-xs text-live-red">{paymentError}</p>
          )}
          {paymentBreakdown && variant === "detail" && (
            <p className="mt-2 text-center text-xs text-muted">
              Total: {paymentBreakdown.totalSol.toFixed(4)} SOL incl. shipping
            </p>
          )}
        </div>
      )}

      {wallet && buyNowPrice != null && (
        <ThreadShippingAddressModal
          open={showShippingModal}
          threadId=""
          auctionId={auction.id}
          buyerWallet={wallet}
          sellerCountry={sellerCountry ?? null}
          shipsInternationally={Boolean(shipsInternationally)}
          domesticShippingUsd={auction.domestic_shipping_usd}
          internationalShippingUsd={auction.international_shipping_usd}
          isExempt={isExempt}
          mode="buy_now"
          onConfirmed={handleShippingConfirmed}
          onDismiss={() => setShowShippingModal(false)}
        />
      )}
    </>
  );
}

export function BuyNowCardButton({
  auction,
  className = "",
}: {
  auction: Auction;
  className?: string;
}) {
  const buyNowPrice = getBuyNowPrice(auction);
  if (
    !hasBuyNowOption(auction) ||
    !buyNowPrice ||
    !isListingLive(auction)
  ) {
    return null;
  }

  return (
    <span
      className={`pointer-events-none mt-2 block w-full rounded-full bg-amber-500/20 py-1.5 text-center text-[10px] font-semibold text-amber-300 ${className}`.trim()}
    >
      Buy Now — {formatSol(buyNowPrice)}
    </span>
  );
}
