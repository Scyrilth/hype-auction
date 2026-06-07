import { supabase } from "@/lib/supabase";

export type CategoryDefinition = {
  id: string;
  label: string;
  emoji: string;
  synonyms: string[];
};

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "trading-cards",
    label: "Trading Cards",
    emoji: "🃏",
    synonyms: [
      "pokemon",
      "pikachu",
      "charizard",
      "yugioh",
      "magic the gathering",
      "mtg",
      "tcg",
      "holo",
      "foil",
      "psa",
      "bgs",
      "graded",
      "topps",
      "panini",
      "sports cards",
      "rookie",
      "refractor",
      "booster",
      "pack",
      "sealed",
      "rare",
      "ultra rare",
      "secret rare",
    ],
  },
  {
    id: "sneakers",
    label: "Sneakers",
    emoji: "👟",
    synonyms: [
      "shoes",
      "kicks",
      "jordan",
      "nike",
      "adidas",
      "yeezy",
      "air force",
      "dunk",
      "sb",
      "new balance",
      "asics",
      "reebok",
      "footwear",
      "collab",
      "og",
      "retro",
      "bred",
      "cement",
      "shadow",
      "panda",
      "zebra",
      "boost",
      "foam",
      "crep",
    ],
  },
  {
    id: "streetwear",
    label: "Streetwear",
    emoji: "👕",
    synonyms: [
      "supreme",
      "bape",
      "bathing ape",
      "off white",
      "palace",
      "kith",
      "noah",
      "stussy",
      "hoodie",
      "tee",
      "shirt",
      "jacket",
      "pullover",
      "box logo",
      "collab",
      "drop",
      "limited",
      "clothing",
      "fashion",
      "hype",
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    emoji: "💻",
    synonyms: [
      "ps5",
      "xbox",
      "playstation",
      "nintendo",
      "switch",
      "iphone",
      "samsung",
      "macbook",
      "laptop",
      "gpu",
      "rtx",
      "graphics card",
      "console",
      "tech",
      "gadget",
      "apple",
      "sony",
      "microsoft",
      "airpods",
      "headphones",
      "monitor",
      "cpu",
    ],
  },
  {
    id: "watches",
    label: "Watches",
    emoji: "⌚",
    synonyms: [
      "rolex",
      "omega",
      "ap",
      "audemars piguet",
      "patek",
      "philippe",
      "cartier",
      "tag heuer",
      "seiko",
      "casio",
      "g shock",
      "timepiece",
      "luxury watch",
      "submariner",
      "datejust",
      "royal oak",
      "speedmaster",
      "dial",
      "bezel",
      "strap",
    ],
  },
  {
    id: "jewelry",
    label: "Jewelry",
    emoji: "💎",
    synonyms: [
      "gold",
      "silver",
      "diamond",
      "chain",
      "ring",
      "necklace",
      "bracelet",
      "iced",
      "bling",
      "pendant",
      "earrings",
      "grillz",
      "cuban link",
      "tennis chain",
      "vvs",
      "moissanite",
      "14k",
      "18k",
      "platinum",
      "rose gold",
    ],
  },
  {
    id: "collectibles",
    label: "Collectibles",
    emoji: "🏆",
    synonyms: [
      "funko",
      "pop",
      "figure",
      "figurine",
      "vintage",
      "rare",
      "limited edition",
      "toy",
      "action figure",
      "lego",
      "statue",
      "diecast",
      "hot wheels",
      "bearbrick",
      "medicom",
      "kaws",
      "anime",
      "manga",
      "comic",
    ],
  },
  {
    id: "sports-memorabilia",
    label: "Sports Memorabilia",
    emoji: "🏀",
    synonyms: [
      "jersey",
      "signed",
      "autograph",
      "ball",
      "bat",
      "helmet",
      "glove",
      "nba",
      "nfl",
      "mlb",
      "nhl",
      "football",
      "basketball",
      "baseball",
      "soccer",
      "championship",
      "trophy",
      "lebron",
      "jordan",
      "kobe",
      "brady",
      "messi",
    ],
  },
  {
    id: "art",
    label: "Art",
    emoji: "🎨",
    synonyms: [
      "painting",
      "print",
      "poster",
      "illustration",
      "canvas",
      "artwork",
      "sketch",
      "drawing",
      "watercolor",
      "oil",
      "acrylic",
      "limited print",
      "screen print",
      "giclee",
      "original",
      "commission",
      "artist",
      "gallery",
      "contemporary",
    ],
  },
  {
    id: "crypto-nfts",
    label: "Crypto & NFTs",
    emoji: "🖼️",
    synonyms: [
      "nft",
      "solana",
      "ethereum",
      "bitcoin",
      "sol",
      "eth",
      "btc",
      "web3",
      "digital art",
      "pfp",
      "generative",
      "on chain",
      "wallet",
      "mint",
      "collection",
      "mad lads",
      "tensor",
    ],
  },
  {
    id: "video-games",
    label: "Video Games",
    emoji: "🎮",
    synonyms: [
      "retro",
      "sealed",
      "cib",
      "complete in box",
      "wata",
      "vga",
      "graded",
      "nintendo",
      "sega",
      "atari",
      "n64",
      "snes",
      "nes",
      "gameboy",
      "ps1",
      "ps2",
      "dreamcast",
      "genesis",
      "cartridge",
    ],
  },
  {
    id: "luxury-bags",
    label: "Luxury Bags",
    emoji: "👜",
    synonyms: [
      "louis vuitton",
      "lv",
      "gucci",
      "chanel",
      "hermes",
      "prada",
      "dior",
      "fendi",
      "balenciaga",
      "ysl",
      "saint laurent",
      "birkin",
      "kelly",
      "neverfull",
      "speedy",
      "tote",
      "clutch",
      "crossbody",
      "monogram",
      "leather",
    ],
  },
  {
    id: "cameras",
    label: "Cameras & Film",
    emoji: "📸",
    synonyms: [
      "canon",
      "nikon",
      "sony",
      "fujifilm",
      "leica",
      "polaroid",
      "film",
      "analog",
      "vintage camera",
      "lens",
      "slr",
      "dslr",
      "mirrorless",
      "point and shoot",
      "lomography",
      "medium format",
      "photography",
    ],
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    synonyms: [
      "vinyl",
      "record",
      "lp",
      "album",
      "signed",
      "autographed",
      "merch",
      "instrument",
      "guitar",
      "bass",
      "drum",
      "limited pressing",
      "first press",
      "band",
      "artist",
      "concert",
      "tour",
      "cassette",
      "cd",
    ],
  },
  {
    id: "coins",
    label: "Coins & Currency",
    emoji: "🪙",
    synonyms: [
      "rare coin",
      "bullion",
      "gold coin",
      "silver coin",
      "mint",
      "proof",
      "numismatic",
      "dollar",
      "quarter",
      "penny",
      "morgan",
      "peace",
      "american eagle",
      "krugerrand",
      "currency",
      "note",
      "banknote",
    ],
  },
];

export function getCategoryLabels(): string[] {
  return CATEGORIES.map((category) => category.label);
}

export function getCategoryByLabel(label: string): CategoryDefinition | undefined {
  const normalized = label.trim().toLowerCase();
  return CATEGORIES.find((category) => category.label.toLowerCase() === normalized);
}

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

function normalizeCategoryTerm(value: string) {
  return value.trim().toLowerCase();
}

function termMatchesQuery(term: string, query: string) {
  const normalizedTerm = normalizeCategoryTerm(term);
  return normalizedTerm.includes(query) || query.includes(normalizedTerm);
}

export function categoryDefinitionMatchesQuery(
  category: CategoryDefinition,
  query: string
): boolean {
  const q = normalizeCategoryTerm(query);
  if (!q) return false;

  if (termMatchesQuery(category.label, q)) return true;
  if (termMatchesQuery(category.id.replace(/-/g, " "), q)) return true;

  return category.synonyms.some((synonym) => termMatchesQuery(synonym, q));
}

export function findMatchingCategories(query: string): CategoryDefinition[] {
  const q = normalizeCategoryTerm(query);
  if (!q) return [];

  return CATEGORIES.filter((category) => categoryDefinitionMatchesQuery(category, q));
}

export function resolveCategoryLabels(query: string): string[] {
  return findMatchingCategories(query).map((category) => category.label);
}

export function vendorCategoriesMatchQuery(
  vendorCategories: string[],
  query: string
): boolean {
  const q = normalizeCategoryTerm(query);
  if (!q) return false;

  if (vendorCategories.some((category) => category.toLowerCase().includes(q))) {
    return true;
  }

  const resolvedLabels = resolveCategoryLabels(query);
  return resolvedLabels.some((label) =>
    vendorCategories.some(
      (category) => category.toLowerCase() === label.toLowerCase()
    )
  );
}

export function auctionCategoryMatchesQuery(
  auctionCategory: string | null | undefined,
  query: string
): boolean {
  const q = normalizeCategoryTerm(query);
  if (!q) return false;

  if ((auctionCategory ?? "").toLowerCase().includes(q)) return true;

  const resolvedLabels = resolveCategoryLabels(query);
  return resolvedLabels.some(
    (label) => auctionCategory?.toLowerCase() === label.toLowerCase()
  );
}

export function countVendorsForCategoryLabel(
  vendors: { categories: string[] }[],
  label: string
): number {
  const normalized = label.toLowerCase();
  return vendors.filter((vendor) =>
    vendor.categories.some((category) => category.toLowerCase() === normalized)
  ).length;
}

export async function getLiveAuctionCountsByCategory(): Promise<
  Map<string, number>
> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("auctions")
    .select("category")
    .eq("status", "live")
    .gt("end_time", now);

  if (error) throw error;

  const counts = new Map(CATEGORIES.map((category) => [category.label, 0]));

  for (const row of data ?? []) {
    const category = row.category as string | null;
    if (category && counts.has(category)) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return counts;
}
