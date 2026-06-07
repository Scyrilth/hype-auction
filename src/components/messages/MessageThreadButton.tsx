"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { getErrorMessage } from "@/lib/errors";
import {
  createAuctionThread,
  createGeneralInquiryThread,
} from "@/lib/messages";

export default function MessageThreadButton({
  variant,
  auctionId,
  auctionTitle,
  sellerWallet,
  buyerWallet,
  className = "",
  label,
}: {
  variant: "seller" | "buyer" | "general";
  auctionId?: string;
  auctionTitle?: string;
  sellerWallet: string;
  buyerWallet?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const connectPhantom = usePhantomConnect();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const defaultLabel =
    variant === "buyer"
      ? "Message Buyer"
      : variant === "general"
        ? "Message Seller"
        : "Message Seller";

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!connected || !publicKey) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click again to open messages.");
      } catch {
        showToast("Connect your wallet to send messages.", "error");
      }
      return;
    }

    const wallet = publicKey.toBase58();

    if (variant === "seller" && wallet === sellerWallet) {
      showToast("You cannot message yourself.", "error");
      return;
    }

    if (variant === "buyer" && buyerWallet && wallet === buyerWallet) {
      showToast("You cannot message yourself.", "error");
      return;
    }

    setLoading(true);
    try {
      let threadId: string;

      if (variant === "general") {
        const thread = await createGeneralInquiryThread(wallet, sellerWallet);
        threadId = thread.id;
      } else {
        if (!auctionId || !auctionTitle) {
          throw new Error("Auction details are required.");
        }

        const buyer =
          variant === "buyer" ? (buyerWallet ?? "") : wallet;
        if (!buyer) throw new Error("Buyer wallet is required.");

        const thread = await createAuctionThread(
          auctionId,
          buyer,
          sellerWallet,
          auctionTitle
        );
        threadId = thread.id;
      }

      router.push(`/messages/${threadId}`);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        "rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
      }
    >
      {loading ? "Opening..." : (label ?? defaultLabel)}
    </button>
  );
}
