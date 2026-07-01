import type { Metadata } from "next";

import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export const SITE_NAME = "Hype Auction";
export const DEFAULT_DESCRIPTION =
  "Live crypto auctions for collectibles, sneakers, and streetwear on Solana with on-chain escrow.";

const DEFAULT_OG_PATH = "/icon.svg";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  imageUrl,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  imageUrl?: string | null;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imageUrl?.trim() || DEFAULT_OG_PATH);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export function buildAuctionMetadata(auction: Auction): Metadata {
  const bid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const title = `${auction.title} — ${bid.toFixed(2)} SOL`;
  const description =
    auction.description?.trim().slice(0, 160) ||
    `Bid on ${auction.title} on ${SITE_NAME}. Current bid ${bid.toFixed(2)} SOL.`;
  const imageUrl = resolveAuctionImageUrl(auction.image_url, auction);

  return buildPageMetadata({
    title,
    description,
    path: `/auction/${auction.id}`,
    imageUrl,
  });
}

export async function fetchSitemapAuctions(): Promise<
  { id: string; created_at: string | null }[]
> {
  const { data, error } = await supabase
    .from("auctions")
    .select("id, created_at")
    .in("status", ["live", "ended", "completed"])
    .eq("is_dummy", false)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[seo] fetchSitemapAuctions", error);
    return [];
  }

  return data ?? [];
}
