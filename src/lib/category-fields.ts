import { getCategoryByLabel } from "@/lib/categories";

export type CategoryFieldType = "text" | "number" | "dropdown";

export interface CategoryFieldDefinition {
  key: string;
  label: string;
  type: CategoryFieldType;
  options?: string[];
  unit?: string;
}

const TRADING_CARDS: CategoryFieldDefinition[] = [
  { key: "set", label: "Set", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "card_number", label: "Card Number", type: "text" },
  {
    key: "language",
    label: "Language",
    type: "dropdown",
    options: [
      "English",
      "Japanese",
      "Korean",
      "Chinese",
      "French",
      "German",
      "Spanish",
      "Portuguese",
      "Italian",
    ],
  },
  {
    key: "print_run",
    label: "Print Run",
    type: "dropdown",
    options: [
      "1st Edition",
      "Unlimited",
      "Shadow",
      "Reverse Holo",
      "Holo",
      "Secret Rare",
    ],
  },
  { key: "certification_number", label: "Certification Number", type: "text" },
];

const SNEAKERS: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    type: "dropdown",
    options: [
      "Nike",
      "Adidas",
      "Jordan",
      "New Balance",
      "Yeezy",
      "Puma",
      "Reebok",
      "Asics",
      "Vans",
      "Converse",
      "Other",
    ],
  },
  { key: "size", label: "Size", type: "number" },
  {
    key: "size_region",
    label: "Size Region",
    type: "dropdown",
    options: ["US Men's", "US Women's", "UK", "EU", "CM"],
  },
  { key: "colorway", label: "Colorway", type: "text" },
  { key: "style_code", label: "Style Code", type: "text" },
  {
    key: "gender",
    label: "Gender",
    type: "dropdown",
    options: ["Men's", "Women's", "Youth", "Unisex"],
  },
  {
    key: "box_condition",
    label: "Box Condition",
    type: "dropdown",
    options: ["Perfect", "Good", "Damaged", "No Box"],
  },
];

const STREETWEAR: CategoryFieldDefinition[] = [
  { key: "brand", label: "Brand", type: "text" },
  {
    key: "size",
    label: "Size",
    type: "dropdown",
    options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  },
  {
    key: "size_system",
    label: "Size System",
    type: "dropdown",
    options: ["US", "EU", "UK", "Japanese"],
  },
  { key: "color", label: "Color", type: "text" },
  { key: "season_year", label: "Season/Year", type: "text" },
  {
    key: "style_cut",
    label: "Style/Cut",
    type: "dropdown",
    options: ["Hoodie", "Tee", "Jacket", "Pants", "Shorts", "Cap", "Other"],
  },
  {
    key: "tags_attached",
    label: "Tags Attached",
    type: "dropdown",
    options: ["Yes", "No"],
  },
];

const ELECTRONICS: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    type: "dropdown",
    options: [
      "Apple",
      "Samsung",
      "Sony",
      "Microsoft",
      "Nintendo",
      "PlayStation",
      "Meta",
      "Other",
    ],
  },
  { key: "model", label: "Model", type: "text" },
  {
    key: "storage",
    label: "Storage",
    type: "dropdown",
    options: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB", "N/A"],
  },
  { key: "color", label: "Color", type: "text" },
  {
    key: "condition_details",
    label: "Condition Details",
    type: "dropdown",
    options: ["Factory Sealed", "Open Box", "Used - Like New", "Used - Good"],
  },
  {
    key: "warranty",
    label: "Warranty Remaining",
    type: "dropdown",
    options: ["Yes", "No", "Expired"],
  },
  {
    key: "region",
    label: "Region",
    type: "dropdown",
    options: ["US", "UK", "EU", "Japan", "Universal"],
  },
];

const WATCHES: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    type: "dropdown",
    options: [
      "Rolex",
      "Audemars Piguet",
      "Patek Philippe",
      "Omega",
      "Cartier",
      "Tag Heuer",
      "Seiko",
      "Casio",
      "Other",
    ],
  },
  { key: "model", label: "Model", type: "text" },
  {
    key: "case_size",
    label: "Case Size",
    type: "dropdown",
    options: ["36mm", "38mm", "40mm", "41mm", "42mm", "44mm", "45mm", "Other"],
  },
  {
    key: "movement",
    label: "Movement",
    type: "dropdown",
    options: ["Automatic", "Manual", "Quartz", "Solar", "Smartwatch"],
  },
  {
    key: "case_material",
    label: "Case Material",
    type: "dropdown",
    options: [
      "Stainless Steel",
      "Gold",
      "Rose Gold",
      "Titanium",
      "Ceramic",
      "Other",
    ],
  },
  {
    key: "bracelet_strap",
    label: "Bracelet/Strap",
    type: "dropdown",
    options: ["Oyster", "Jubilee", "Leather", "Rubber", "NATO", "Mesh", "Other"],
  },
  { key: "year", label: "Year", type: "number" },
  {
    key: "box_papers",
    label: "Box & Papers",
    type: "dropdown",
    options: ["Full Set", "Box Only", "Papers Only", "None"],
  },
  { key: "reference_number", label: "Reference Number", type: "text" },
];

const JEWELRY: CategoryFieldDefinition[] = [
  {
    key: "type",
    label: "Type",
    type: "dropdown",
    options: [
      "Ring",
      "Necklace",
      "Bracelet",
      "Earrings",
      "Chain",
      "Pendant",
      "Grillz",
      "Anklet",
      "Other",
    ],
  },
  {
    key: "metal",
    label: "Metal",
    type: "dropdown",
    options: [
      "Gold",
      "White Gold",
      "Rose Gold",
      "Silver",
      "Platinum",
      "Titanium",
      "Other",
    ],
  },
  {
    key: "karat",
    label: "Karat",
    type: "dropdown",
    options: [
      "9K",
      "10K",
      "14K",
      "18K",
      "22K",
      "24K",
      "925 Silver",
      "950 Platinum",
      "Other",
    ],
  },
  {
    key: "stone",
    label: "Stone",
    type: "dropdown",
    options: [
      "Diamond",
      "Moissanite",
      "Ruby",
      "Emerald",
      "Sapphire",
      "Pearl",
      "None",
      "Other",
    ],
  },
  { key: "weight", label: "Weight", type: "number", unit: "grams" },
  { key: "size_length", label: "Size/Length", type: "number" },
  {
    key: "size_system",
    label: "Size System",
    type: "dropdown",
    options: ["US Ring Size", "UK Ring Size", "EU Ring Size", "CM", "Inches"],
  },
  {
    key: "certified",
    label: "Certified",
    type: "dropdown",
    options: ["GIA", "IGI", "AGS", "None"],
  },
];

const COLLECTIBLES: CategoryFieldDefinition[] = [
  { key: "brand", label: "Brand/Manufacturer", type: "text" },
  { key: "character", label: "Character/Subject", type: "text" },
  { key: "series", label: "Series/Line", type: "text" },
  { key: "year", label: "Year Released", type: "number" },
  {
    key: "edition",
    label: "Edition",
    type: "dropdown",
    options: [
      "Standard",
      "Limited Edition",
      "Exclusive",
      "Convention",
      "Artist Proof",
      "Other",
    ],
  },
  {
    key: "scale",
    label: "Scale",
    type: "dropdown",
    options: ["1:1", "1:6", "1:12", "1:18", "1:64", "Other"],
  },
  {
    key: "box_condition",
    label: "Box Condition",
    type: "dropdown",
    options: ["Mint in Box", "Good", "Opened", "No Box"],
  },
];

const SPORTS_MEMORABILIA: CategoryFieldDefinition[] = [
  {
    key: "sport",
    label: "Sport",
    type: "dropdown",
    options: [
      "Basketball",
      "Football",
      "Soccer",
      "Baseball",
      "Tennis",
      "Golf",
      "Boxing",
      "MMA",
      "Other",
    ],
  },
  { key: "team", label: "Team", type: "text" },
  { key: "player", label: "Player/Athlete", type: "text" },
  { key: "year", label: "Year", type: "number" },
  {
    key: "item_type",
    label: "Item Type",
    type: "dropdown",
    options: [
      "Jersey",
      "Signed Ball",
      "Signed Card",
      "Photo",
      "Helmet",
      "Bat",
      "Glove",
      "Trophy",
      "Other",
    ],
  },
  {
    key: "authentication",
    label: "Authentication",
    type: "dropdown",
    options: ["PSA/DNA", "Beckett", "JSA", "Fanatics", "None"],
  },
  { key: "authentication_number", label: "Authentication Number", type: "text" },
];

const ART: CategoryFieldDefinition[] = [
  { key: "artist", label: "Artist", type: "text" },
  {
    key: "medium",
    label: "Medium",
    type: "dropdown",
    options: [
      "Oil",
      "Acrylic",
      "Watercolor",
      "Digital",
      "Screen Print",
      "Lithograph",
      "Photography",
      "Mixed Media",
      "Other",
    ],
  },
  { key: "width", label: "Width", type: "number" },
  { key: "height", label: "Height", type: "number" },
  {
    key: "unit",
    label: "Unit",
    type: "dropdown",
    options: ["cm", "inches"],
  },
  { key: "year_created", label: "Year Created", type: "number" },
  {
    key: "edition",
    label: "Edition",
    type: "dropdown",
    options: ["Original", "Limited Print", "Open Edition", "Artist Proof"],
  },
  { key: "print_number", label: "Print Number", type: "text" },
  {
    key: "signed",
    label: "Signed",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  {
    key: "coa",
    label: "Certificate of Authenticity",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  {
    key: "frame",
    label: "Frame",
    type: "dropdown",
    options: ["Framed", "Unframed"],
  },
];

const CRYPTO_NFTS: CategoryFieldDefinition[] = [
  {
    key: "blockchain",
    label: "Blockchain",
    type: "dropdown",
    options: ["Solana", "Ethereum", "Bitcoin", "Polygon", "Avalanche", "Other"],
  },
  { key: "collection", label: "Collection Name", type: "text" },
  { key: "token_id", label: "Token ID", type: "text" },
  { key: "rarity_rank", label: "Rarity Rank", type: "number" },
  { key: "traits", label: "Traits", type: "text" },
  { key: "marketplace_link", label: "Marketplace Link", type: "text" },
];

const VIDEO_GAMES: CategoryFieldDefinition[] = [
  {
    key: "platform",
    label: "Platform",
    type: "dropdown",
    options: [
      "PS5",
      "PS4",
      "PS3",
      "Xbox Series X",
      "Xbox One",
      "Nintendo Switch",
      "PC",
      "GBA",
      "SNES",
      "N64",
      "Sega Genesis",
      "Other",
    ],
  },
  {
    key: "region",
    label: "Region",
    type: "dropdown",
    options: ["NTSC-US", "NTSC-J", "PAL", "Universal"],
  },
  { key: "publisher", label: "Publisher", type: "text" },
  { key: "year", label: "Year", type: "number" },
  {
    key: "rating",
    label: "Rating",
    type: "dropdown",
    options: [
      "E",
      "E10+",
      "T",
      "M",
      "AO",
      "PEGI 3",
      "PEGI 7",
      "PEGI 12",
      "PEGI 16",
      "PEGI 18",
    ],
  },
  {
    key: "completeness",
    label: "Completeness",
    type: "dropdown",
    options: ["Sealed", "CIB - Complete in Box", "Cart/Disc Only", "No Manual"],
  },
  {
    key: "professional_grade",
    label: "Professional Grade",
    type: "dropdown",
    options: ["WATA", "VGA", "CGC", "None"],
  },
];

const LUXURY_BAGS: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    type: "dropdown",
    options: [
      "Louis Vuitton",
      "Gucci",
      "Chanel",
      "Hermès",
      "Prada",
      "Dior",
      "Fendi",
      "Balenciaga",
      "YSL",
      "Bottega Veneta",
      "Other",
    ],
  },
  { key: "model", label: "Model/Style", type: "text" },
  {
    key: "material",
    label: "Material",
    type: "dropdown",
    options: ["Canvas", "Leather", "Suede", "Patent Leather", "Exotic", "Other"],
  },
  { key: "color", label: "Color", type: "text" },
  {
    key: "hardware",
    label: "Hardware",
    type: "dropdown",
    options: ["Gold", "Silver", "Palladium", "Ruthenium", "Other"],
  },
  { key: "width", label: "Width", type: "number" },
  { key: "height", label: "Height", type: "number" },
  { key: "depth", label: "Depth", type: "number" },
  {
    key: "unit",
    label: "Unit",
    type: "dropdown",
    options: ["cm", "inches"],
  },
  {
    key: "authenticity_card",
    label: "Authenticity Card",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  {
    key: "dustbag",
    label: "Dustbag",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  {
    key: "receipt",
    label: "Receipt",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  { key: "year", label: "Year", type: "number" },
];

const CAMERAS: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    type: "dropdown",
    options: [
      "Canon",
      "Nikon",
      "Sony",
      "Fujifilm",
      "Leica",
      "Hasselblad",
      "Olympus",
      "Pentax",
      "Polaroid",
      "Other",
    ],
  },
  { key: "model", label: "Model", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "dropdown",
    options: [
      "DSLR",
      "Mirrorless",
      "Film SLR",
      "Point & Shoot",
      "Medium Format",
      "Large Format",
      "Instant",
      "Other",
    ],
  },
  {
    key: "film_format",
    label: "Film Format",
    type: "dropdown",
    options: ["35mm", "120", "4x5", "Instant", "Digital", "N/A"],
  },
  { key: "sensor", label: "Sensor/Resolution", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "shutter_count", label: "Shutter Count", type: "number" },
  { key: "included", label: "Included", type: "text" },
];

const MUSIC: CategoryFieldDefinition[] = [
  { key: "artist", label: "Artist/Band", type: "text" },
  { key: "album", label: "Album/Title", type: "text" },
  {
    key: "format",
    label: "Format",
    type: "dropdown",
    options: [
      "Vinyl LP",
      'Vinyl 7"',
      'Vinyl 12"',
      "CD",
      "Cassette",
      "Signed Item",
      "Instrument",
      "Other",
    ],
  },
  { key: "year", label: "Year", type: "number" },
  { key: "label", label: "Label", type: "text" },
  {
    key: "pressing",
    label: "Pressing",
    type: "dropdown",
    options: [
      "Original",
      "Repress",
      "Limited",
      "Colored Vinyl",
      "Picture Disc",
      "Other",
    ],
  },
  {
    key: "signed",
    label: "Signed",
    type: "dropdown",
    options: ["Yes", "No"],
  },
  {
    key: "grade",
    label: "Grade/Condition",
    type: "dropdown",
    options: [
      "Mint",
      "Near Mint",
      "Very Good Plus",
      "Very Good",
      "Good",
      "Fair",
      "Poor",
    ],
  },
];

const COINS: CategoryFieldDefinition[] = [
  { key: "country", label: "Country", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "denomination", label: "Denomination", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "dropdown",
    options: ["Coin", "Banknote", "Bullion", "Token", "Medal", "Other"],
  },
  {
    key: "metal",
    label: "Metal",
    type: "dropdown",
    options: [
      "Gold",
      "Silver",
      "Copper",
      "Nickel",
      "Platinum",
      "Mixed",
      "Paper",
      "Other",
    ],
  },
  {
    key: "grade",
    label: "Grade",
    type: "dropdown",
    options: [
      "MS70",
      "MS69",
      "MS68",
      "PR70",
      "PR69",
      "MS65",
      "MS60",
      "AU58",
      "EF40",
      "VF20",
      "F12",
      "VG8",
      "G4",
      "Poor",
    ],
  },
  {
    key: "grading_service",
    label: "Grading Service",
    type: "dropdown",
    options: ["PCGS", "NGC", "ANACS", "ICG", "Raw/Ungraded"],
  },
  { key: "certification_number", label: "Certification Number", type: "text" },
  { key: "mint_mark", label: "Mint Mark", type: "text" },
  { key: "mintage", label: "Mintage", type: "number" },
];

export const CATEGORY_FIELDS_BY_ID: Record<string, CategoryFieldDefinition[]> =
  {
    "trading-cards": TRADING_CARDS,
    sneakers: SNEAKERS,
    streetwear: STREETWEAR,
    electronics: ELECTRONICS,
    watches: WATCHES,
    jewelry: JEWELRY,
    collectibles: COLLECTIBLES,
    "sports-memorabilia": SPORTS_MEMORABILIA,
    art: ART,
    "crypto-nfts": CRYPTO_NFTS,
    "video-games": VIDEO_GAMES,
    "luxury-bags": LUXURY_BAGS,
    cameras: CAMERAS,
    music: MUSIC,
    coins: COINS,
  };

export function getCategoryFields(
  categoryLabel: string
): CategoryFieldDefinition[] {
  const category = getCategoryByLabel(categoryLabel);
  if (!category) return [];
  return CATEGORY_FIELDS_BY_ID[category.id] ?? [];
}

export function getCategoryFieldByKey(
  categoryLabel: string | null | undefined,
  key: string
): CategoryFieldDefinition | undefined {
  if (!categoryLabel) return undefined;
  return getCategoryFields(categoryLabel).find((field) => field.key === key);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getItemDetailLabel(
  categoryLabel: string | null | undefined,
  key: string
): string {
  return getCategoryFieldByKey(categoryLabel, key)?.label ?? humanizeKey(key);
}

export function formatItemDetailValue(
  categoryLabel: string | null | undefined,
  key: string,
  value: string
): string {
  const field = getCategoryFieldByKey(categoryLabel, key);
  if (field?.type === "number" && field.unit && value.trim()) {
    return `${value.trim()} ${field.unit}`;
  }
  return value;
}
