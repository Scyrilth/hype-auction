export const POKEMON_PLACEHOLDER =
  "https://psacard.com/assets/img/pop-report/pokemon.png";

export const SNEAKER_PLACEHOLDER =
  "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-jordan-1-retro-high-og-shoes-kQRqvz.png";

export const DEFAULT_PLACEHOLDER =
  "https://placehold.co/800x600/1a1a2e/white?text=Live+Auction";

/** Legacy Unsplash IDs used in early seed data — map to working replacements. */
const LEGACY_UNSPLASH_IMAGES: Record<string, string> = {
  "photo-1606503908835": POKEMON_PLACEHOLDER,
  "photo-1542291026": SNEAKER_PLACEHOLDER,
};

function isSneakerAuction(auction: { category: string | null; title: string }) {
  return (
    auction.category === "Sneakers" ||
    /jordan|yeezy|sneaker|nike|adidas/i.test(auction.title)
  );
}

function isPokemonAuction(auction: { category: string | null; title: string }) {
  return (
    auction.category === "Trading Cards" ||
    /pokemon|pikachu|card|holo/i.test(auction.title)
  );
}

function replaceLegacyImageUrl(
  imageUrl: string,
  auction: { category: string | null; title: string }
): string | null {
  if (!imageUrl.includes("unsplash.com")) {
    return null;
  }

  for (const [photoId, replacement] of Object.entries(LEGACY_UNSPLASH_IMAGES)) {
    if (imageUrl.includes(photoId)) {
      return replacement;
    }
  }

  if (isSneakerAuction(auction)) return SNEAKER_PLACEHOLDER;
  if (isPokemonAuction(auction)) return POKEMON_PLACEHOLDER;
  return DEFAULT_PLACEHOLDER;
}

export function pickAuctionImageFallback(auction: {
  category: string | null;
  title: string;
}): string {
  if (isSneakerAuction(auction)) return SNEAKER_PLACEHOLDER;
  if (isPokemonAuction(auction)) return POKEMON_PLACEHOLDER;
  return DEFAULT_PLACEHOLDER;
}

export function resolveAuctionImageUrl(
  imageUrl: string | null | undefined,
  auction: { category: string | null; title: string }
): string {
  if (imageUrl) {
    const legacyReplacement = replaceLegacyImageUrl(imageUrl, auction);
    if (legacyReplacement) {
      return legacyReplacement;
    }

    if (
      isSneakerAuction(auction) &&
      (imageUrl.includes("images.stockx.com") ||
        imageUrl.includes("sneakernews.com"))
    ) {
      return SNEAKER_PLACEHOLDER;
    }
  }

  const fallback = pickAuctionImageFallback(auction);

  if (!imageUrl || imageUrl.includes("unsplash.com")) {
    return fallback;
  }

  return imageUrl;
}

export function isOptimizableImageUrl(src: string): boolean {
  return (
    src.includes("psacard.com") ||
    src.includes("static.nike.com") ||
    src.includes("images.stockx.com") ||
    src.includes("placehold.co") ||
    src.includes("images.unsplash.com") ||
    src.includes("supabase.co")
  );
}
