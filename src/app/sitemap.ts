import type { MetadataRoute } from "next";

import { fetchSitemapAuctions, getSiteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/browse",
  "/live",
  "/vendors",
  "/categories",
  "/seller-guide",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.8,
  }));

  const auctions = await fetchSitemapAuctions();
  const auctionEntries: MetadataRoute.Sitemap = auctions.map((auction) => ({
    url: `${siteUrl}/auction/${auction.id}`,
    lastModified: auction.created_at ? new Date(auction.created_at) : now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticEntries, ...auctionEntries];
}
