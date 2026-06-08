import { writeFileSync } from "fs";
import { createHash } from "crypto";

const VENDORS = [
  "DUMMY_VENDOR_001",
  "DUMMY_VENDOR_002",
  "DUMMY_VENDOR_003",
  "DUMMY_VENDOR_004",
  "DUMMY_VENDOR_005",
  "DUMMY_VENDOR_006",
  "DUMMY_VENDOR_007",
  "DUMMY_VENDOR_008",
  "DUMMY_VENDOR_009",
  "DUMMY_VENDOR_010",
];

const MAIN_WALLET = "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT";
const CONDITIONS = ["mint", "near_mint", "excellent", "good", "fair"];

const CATEGORIES = [
  {
    name: "Trading Cards",
    listings: [
      {
        title: "PSA 10 1999 Pokémon Charizard Holo #4 Base Set",
        desc: "Iconic Base Set Charizard in PSA 10 gem mint condition. Slab is clean with sharp corners and vibrant holo swirl.",
        details: {
          set: "Base Set",
          year: "1999",
          card_number: "4",
          grade: "PSA 10",
          grade_score: "10",
          grading_company: "PSA",
          language: "English",
          first_edition: false,
        },
      },
      {
        title: "BGS 9.5 2003 Pokémon Skyridge Crystal Charizard Holo #146",
        desc: "Rare Skyridge Crystal Charizard with strong subgrades. A centerpiece for any vintage Pokémon collection.",
        details: {
          set: "Skyridge",
          year: "2003",
          card_number: "146",
          grade: "BGS 9.5",
          grade_score: "9.5",
          grading_company: "BGS",
          language: "English",
          first_edition: false,
        },
      },
      {
        title: "PSA 9 2019 Pokémon Hidden Fates Shiny Charizard GX #SV49",
        desc: "Shiny Vault Charizard GX graded PSA 9. Popular modern chase card with clean centering.",
        details: {
          set: "Hidden Fates",
          year: "2019",
          card_number: "SV49",
          grade: "PSA 9",
          grade_score: "9",
          grading_company: "PSA",
          language: "English",
          first_edition: false,
        },
      },
      {
        title: "Raw 2000 Pokémon Neo Genesis Lugia Holo #9",
        desc: "Neo Genesis Lugia holo raw card in excellent condition. Light whitening on back corners only.",
        details: {
          set: "Neo Genesis",
          year: "2000",
          card_number: "9",
          grade: "Raw NM",
          grade_score: "8",
          grading_company: "None",
          language: "English",
          first_edition: false,
        },
      },
    ],
  },
  {
    name: "Sneakers",
    listings: [
      {
        title: "Nike Air Jordan 1 Retro High OG Chicago 2022 DS Size 10",
        desc: "Deadstock Chicago 1 Reimagined with full original packaging. Never tried on, factory laced.",
        details: {
          brand: "Nike",
          model: "Air Jordan 1 Retro High OG",
          size: "US 10",
          colorway: "Chicago",
          year: "2022",
          condition_detail: "DS",
          box: "Original box included",
        },
      },
      {
        title: "Adidas Yeezy Boost 350 V2 Zebra Size 11",
        desc: "Authentic Yeezy 350 Zebra lightly worn twice. Soles show minimal wear, uppers are clean.",
        details: {
          brand: "Adidas",
          model: "Yeezy Boost 350 V2",
          size: "US 11",
          colorway: "Zebra",
          year: "2021",
          condition_detail: "VNDS",
          box: "Original box included",
        },
      },
      {
        title: "New Balance 550 White Green Size 9.5",
        desc: "Clean NB 550 in white and green colorway. Great everyday pair with OG box.",
        details: {
          brand: "New Balance",
          model: "550",
          size: "US 9.5",
          colorway: "White Green",
          year: "2023",
          condition_detail: "DS",
          box: "Original box included",
        },
      },
      {
        title: "Nike Dunk Low Panda Size 8",
        desc: "Panda Dunk Low in near-mint condition. Worn indoors a handful of times.",
        details: {
          brand: "Nike",
          model: "Dunk Low",
          size: "US 8",
          colorway: "Black White",
          year: "2023",
          condition_detail: "Near DS",
          box: "Original box included",
        },
      },
    ],
  },
  {
    name: "Streetwear",
    listings: [
      {
        title: "Supreme FW22 Box Logo Hoodie Black Large",
        desc: "Authentic Supreme box logo hoodie from FW22. Tags attached, never washed.",
        details: {
          brand: "Supreme",
          size: "L",
          season: "FW22",
          colorway: "Black",
          tags: "attached",
        },
      },
      {
        title: "BAPE Shark Full Zip Hoodie Camo Medium",
        desc: "Classic BAPE shark hoodie in green camo. Light wear, no fading on graphics.",
        details: {
          brand: "A Bathing Ape",
          size: "M",
          season: "SS21",
          colorway: "Green Camo",
          tags: "removed",
        },
      },
      {
        title: "Off-White Arrow Logo Tee White XL",
        desc: "Off-White arrow logo tee in white. Purchased from authorized retailer.",
        details: {
          brand: "Off-White",
          size: "XL",
          season: "SS20",
          colorway: "White",
          tags: "attached",
        },
      },
      {
        title: "Palace Tri-Ferg Hoodie Grey Large",
        desc: "Palace tri-ferg hoodie in heather grey. Great condition with minimal pilling.",
        details: {
          brand: "Palace",
          size: "L",
          season: "AW19",
          colorway: "Grey",
          tags: "attached",
        },
      },
    ],
  },
  {
    name: "Crypto & NFTs",
    listings: [
      {
        title: "Mad Lads #4521 — Rare Gold Laser Eyes",
        desc: "Solana Mad Lads NFT with rare gold background and laser eyes traits. Transfer via escrow.",
        details: {
          blockchain: "Solana",
          collection: "Mad Lads",
          token_id: "#4521",
          rarity: "Rare",
          attributes: "Gold background, laser eyes",
        },
      },
      {
        title: "DeGods #1872 — Mythic Background",
        desc: "DeGods mythic background edition on Solana. Verified ownership, clean transfer history.",
        details: {
          blockchain: "Solana",
          collection: "DeGods",
          token_id: "#1872",
          rarity: "Mythic",
          attributes: "Mythic background, crown trait",
        },
      },
      {
        title: "Tensorians #903 — Animated Trait",
        desc: "Tensorians PFP with animated trait combo. Low serial mint from early collection drop.",
        details: {
          blockchain: "Solana",
          collection: "Tensorians",
          token_id: "#903",
          rarity: "Uncommon",
          attributes: "Animated eyes, neon suit",
        },
      },
      {
        title: "Claynosaurz #2201 — Mythic Skin Variant",
        desc: "Claynosaurz NFT with mythic skin variant on Solana. Verified on Tensor marketplace.",
        details: {
          blockchain: "Solana",
          collection: "Claynosaurz",
          token_id: "#2201",
          rarity: "Mythic",
          attributes: "Mythic skin, gold horns",
        },
      },
    ],
  },
  {
    name: "Watches",
    listings: [
      {
        title: "Rolex Submariner 116610LN 2021 Full Set",
        desc: "Black Submariner Date with box, papers, and remaining factory warranty. Excellent daily wearer.",
        details: {
          brand: "Rolex",
          model: "Submariner Date",
          year: "2021",
          movement: "Automatic",
          case_size: "41mm",
          papers: true,
          box: true,
        },
      },
      {
        title: "Omega Speedmaster Professional Moonwatch 2022",
        desc: "Hesalite Speedmaster with full kit. Keeps excellent time and includes extra strap.",
        details: {
          brand: "Omega",
          model: "Speedmaster Professional",
          year: "2022",
          movement: "Manual",
          case_size: "42mm",
          papers: true,
          box: true,
        },
      },
      {
        title: "TAG Heuer Carrera Calibre 16 Chronograph",
        desc: "Carrera chronograph with black dial and steel bracelet. Light desk wear only.",
        details: {
          brand: "TAG Heuer",
          model: "Carrera Calibre 16",
          year: "2019",
          movement: "Automatic",
          case_size: "41mm",
          papers: true,
          box: false,
        },
      },
      {
        title: "Seiko Prospex SPB143 Diver",
        desc: "Fan-favorite 62MAS reissue diver. Barely worn with original warranty card.",
        details: {
          brand: "Seiko",
          model: "Prospex SPB143",
          year: "2023",
          movement: "Automatic",
          case_size: "40.5mm",
          papers: true,
          box: true,
        },
      },
    ],
  },
  {
    name: "Jewelry",
    listings: [
      {
        title: "18k Gold Diamond Solitaire Ring 0.75ct GIA",
        desc: "Classic solitaire ring with GIA-certified diamond. Size 6.5, excellent sparkle.",
        details: {
          metal: "Gold",
          karat: "18k",
          gemstone: "Diamond",
          weight: "5.2g",
          certificate: "GIA",
          style: "Ring",
        },
      },
      {
        title: "Platinum Sapphire Pendant Necklace",
        desc: "Platinum pendant with natural blue sapphire. Includes appraisal documentation.",
        details: {
          metal: "Platinum",
          karat: "950",
          gemstone: "Sapphire",
          weight: "8.1g",
          certificate: "AGS",
          style: "Necklace",
        },
      },
      {
        title: "Sterling Silver Cuban Link Chain 22in",
        desc: "Heavy sterling Cuban link chain in polished finish. Clasp is secure and stamped .925.",
        details: {
          metal: "Silver",
          karat: "925",
          gemstone: "None",
          weight: "62g",
          certificate: "Hallmark",
          style: "Chain",
        },
      },
      {
        title: "14k Rose Gold Morganite Halo Ring Size 7",
        desc: "Delicate rose gold halo ring with morganite center stone. Includes appraisal paperwork.",
        details: {
          metal: "Gold",
          karat: "14k",
          gemstone: "Morganite",
          weight: "3.8g",
          certificate: "Appraisal",
          style: "Ring",
        },
      },
    ],
  },
  {
    name: "Art",
    listings: [
      {
        title: "Original Oil Painting — Coastal Sunset by M. Rivera",
        desc: "Signed original oil on canvas depicting a coastal sunset. Wired and ready to hang.",
        details: {
          artist: "M. Rivera",
          medium: "Oil on Canvas",
          dimensions: "24x36 inches",
          year: "2020",
          signed: true,
          certificate: true,
        },
      },
      {
        title: "Limited Screen Print — Urban Geometry by K. Tan",
        desc: "Editioned screen print with bold geometric forms. Numbered 18/100 with COA.",
        details: {
          artist: "K. Tan",
          medium: "Screen Print",
          dimensions: "18x24 inches",
          year: "2021",
          signed: true,
          certificate: true,
        },
      },
      {
        title: "Contemporary Acrylic Abstract No. 7",
        desc: "Vibrant acrylic abstract on gallery-wrapped canvas. Great statement piece for modern interiors.",
        details: {
          artist: "L. Chen",
          medium: "Acrylic on Canvas",
          dimensions: "30x40 inches",
          year: "2022",
          signed: true,
          certificate: false,
        },
      },
      {
        title: "Signed Lithograph — City Lights by A. Moss",
        desc: "Limited lithograph print numbered 42/200. Framed with archival matting.",
        details: {
          artist: "A. Moss",
          medium: "Lithograph",
          dimensions: "20x28 inches",
          year: "2018",
          signed: true,
          certificate: true,
        },
      },
    ],
  },
  {
    name: "Collectibles",
    listings: [
      {
        title: "KAWS Companion Flayed Open Edition Brown",
        desc: "KAWS Companion flayed figure in brown. Displayed in smoke-free home, includes original packaging.",
        details: {
          brand: "KAWS",
          series: "Companion",
          year: "2019",
          limited_edition: true,
          numbered: "234/500",
          condition_detail: "sealed",
        },
      },
      {
        title: "Funko Pop! Metallic Batman SDCC 2010",
        desc: "Rare SDCC metallic Batman Funko with protector. Box has minor shelf wear.",
        details: {
          brand: "Funko",
          series: "Pop! Heroes",
          year: "2010",
          limited_edition: true,
          numbered: "Unnumbered",
          condition_detail: "near mint box",
        },
      },
      {
        title: "Bearbrick 1000% Andy Warhol Banana",
        desc: "Large format Bearbrick collaboration piece. Stored in original shipper box.",
        details: {
          brand: "Medicom Toy",
          series: "Bearbrick",
          year: "2018",
          limited_edition: true,
          numbered: "Open edition",
          condition_detail: "displayed",
        },
      },
    ],
  },
  {
    name: "Electronics",
    listings: [
      {
        title: "Apple iPhone 15 Pro 256GB Black Titanium — Sealed",
        desc: "Factory sealed iPhone 15 Pro unlocked model. Apple warranty intact.",
        details: {
          brand: "Apple",
          model: "iPhone 15 Pro",
          year: "2023",
          storage: "256GB",
          color: "Black Titanium",
          condition_detail: "sealed",
          warranty: true,
        },
      },
      {
        title: "Sony PlayStation 5 Disc Edition Bundle",
        desc: "PS5 disc console with two controllers and charging dock. Light use, runs perfectly.",
        details: {
          brand: "Sony",
          model: "PlayStation 5",
          year: "2022",
          storage: "825GB",
          color: "White",
          condition_detail: "excellent",
          warranty: false,
        },
      },
      {
        title: "NVIDIA GeForce RTX 4080 Founders Edition",
        desc: "FE 4080 used for light gaming only. Never mined, includes original box and accessories.",
        details: {
          brand: "NVIDIA",
          model: "RTX 4080 FE",
          year: "2023",
          storage: "16GB GDDR6X",
          color: "Black",
          condition_detail: "excellent",
          warranty: true,
        },
      },
      {
        title: "Apple MacBook Air M2 13-inch 512GB Midnight",
        desc: "M2 MacBook Air with low battery cycle count. Includes charger and original box.",
        details: {
          brand: "Apple",
          model: "MacBook Air M2",
          year: "2023",
          storage: "512GB",
          color: "Midnight",
          condition_detail: "like new",
          warranty: true,
        },
      },
    ],
  },
  {
    name: "Sports Memorabilia",
    listings: [
      {
        title: "Kobe Bryant Signed Lakers Jersey JSA Authenticated",
        desc: "Purple Lakers jersey signed by Kobe Bryant with JSA COA. Framed with UV-protective glass.",
        details: {
          sport: "Basketball",
          player: "Kobe Bryant",
          team: "Lakers",
          year: "2010",
          type: "Jersey",
          signed: true,
          authentication: "JSA",
        },
      },
      {
        title: "Tom Brady Signed Patriots Mini Helmet",
        desc: "Mini helmet signed by Tom Brady during Patriots era. Includes Beckett COA.",
        details: {
          sport: "Football",
          player: "Tom Brady",
          team: "Patriots",
          year: "2018",
          type: "Mini Helmet",
          signed: true,
          authentication: "Beckett",
        },
      },
      {
        title: "LeBron James Game-Used Warmup Jacket LOA",
        desc: "Cavs-era warmup jacket with photomatch LOA. Unique piece for serious basketball collectors.",
        details: {
          sport: "Basketball",
          player: "LeBron James",
          team: "Cavaliers",
          year: "2017",
          type: "Jacket",
          signed: false,
          authentication: "Photo Match LOA",
        },
      },
    ],
  },
  {
    name: "Vintage",
    listings: [
      {
        title: "1970s Leather Flight Jacket USAF Style",
        desc: "Vintage brown leather bomber jacket with quilted lining. Broken-in patina with no major flaws.",
        details: {
          decade: "1970s",
          origin: "USA",
          material: "Leather",
          dimensions: "Size L",
          provenance: "Found at estate sale",
        },
      },
      {
        title: "1960s Kodak Instamatic Camera Working",
        desc: "Classic Instamatic camera in working condition. Includes original case and manual.",
        details: {
          decade: "1960s",
          origin: "USA",
          material: "Plastic/Metal",
          dimensions: "5x3 inches",
          provenance: "Estate collection",
        },
      },
      {
        title: "1980s Sony Walkman WM-2",
        desc: "Iconic yellow Sports Walkman tested and playing tapes smoothly. Minor cosmetic wear.",
        details: {
          decade: "1980s",
          origin: "Japan",
          material: "Plastic",
          dimensions: "4x3 inches",
          provenance: "Private collector",
        },
      },
    ],
  },
  {
    name: "Toys & Games",
    listings: [
      {
        title: "Bandai RG Nu Gundam Model Kit — Sealed",
        desc: "Real Grade Nu Gundam kit factory sealed. Perfect for Gunpla builders and collectors.",
        details: {
          brand: "Bandai",
          series: "Gundam",
          year: "2020",
          condition_detail: "sealed",
          complete: true,
          box: true,
        },
      },
      {
        title: "LEGO Star Wars UCS Millennium Falcon 75192",
        desc: "Complete UCS Falcon with instructions and all minifigures. Built once and disassembled.",
        details: {
          brand: "LEGO",
          series: "Star Wars UCS",
          year: "2017",
          condition_detail: "complete",
          complete: true,
          box: true,
        },
      },
      {
        title: "Magic: The Gathering Black Lotus Proxy Display Set",
        desc: "High-quality display proxies of Power Nine for showcase only. Not tournament legal.",
        details: {
          brand: "Wizards of the Coast",
          series: "Alpha",
          year: "1993",
          condition_detail: "display",
          complete: true,
          box: false,
        },
      },
    ],
  },
  {
    name: "Music",
    listings: [
      {
        title: "The Beatles Abbey Road First UK Pressing VG+",
        desc: "Original UK pressing of Abbey Road with trail-off markings. Plays cleanly with light sleeve wear.",
        details: {
          artist: "The Beatles",
          album: "Abbey Road",
          year: "1969",
          format: "Vinyl",
          pressing: "First UK pressing",
          grade: "VG+",
        },
      },
      {
        title: "Nirvana Nevermind 1991 US Pressing",
        desc: "Nevermind LP on DGC with original inner sleeve. Classic grunge essential.",
        details: {
          artist: "Nirvana",
          album: "Nevermind",
          year: "1991",
          format: "Vinyl",
          pressing: "US first press",
          grade: "VG",
        },
      },
    ],
  },
  {
    name: "Comics",
    listings: [
      {
        title: "Amazing Spider-Man #300 CGC 9.8 First Venom",
        desc: "Key first full appearance of Venom in CGC 9.8 white pages. Investment-grade slab.",
        details: {
          title: "Amazing Spider-Man",
          issue: "#300",
          year: "1988",
          publisher: "Marvel",
          grade: "CGC 9.8",
          grading_company: "CGC",
          key_issue: true,
        },
      },
      {
        title: "Batman The Dark Knight Returns #1 CGC 9.6",
        desc: "Frank Miller classic first print in CGC 9.6. Sharp corners and rich colors.",
        details: {
          title: "Batman: The Dark Knight Returns",
          issue: "#1",
          year: "1986",
          publisher: "DC",
          grade: "CGC 9.6",
          grading_company: "CGC",
          key_issue: true,
        },
      },
    ],
  },
  {
    name: "Luxury Goods",
    listings: [
      {
        title: "Louis Vuitton Neverfull MM Monogram Tote",
        desc: "Authentic Neverfull MM with pochette and date code. Interior clean, handles have light patina.",
        details: {
          brand: "Louis Vuitton",
          item_type: "Bag",
          material: "Monogram Canvas",
          year: "2022",
          authentication: "card included",
          condition_detail: "like new",
        },
      },
      {
        title: "Gucci GG Marmont Small Shoulder Bag Black",
        desc: "Gucci Marmont in black leather with gold hardware. Includes dust bag and authenticity card.",
        details: {
          brand: "Gucci",
          item_type: "Bag",
          material: "Leather",
          year: "2021",
          authentication: "card included",
          condition_detail: "excellent",
        },
      },
    ],
  },
];

function sqlStr(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlJson(obj) {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const lines = [];

lines.push(`-- =============================================================================
-- HYPE AUCTION — SEED DUMMY DATA
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================================

-- ═══════════════════════════════════════════
-- CLEANUP — Run these to remove all dummy data
-- ═══════════════════════════════════════════
-- DELETE FROM public.direct_messages WHERE thread_id IN (SELECT id FROM public.message_threads WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true));
-- DELETE FROM public.message_threads WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.notifications WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.watchlist WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.bids WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.reviews WHERE is_dummy = true;
-- DELETE FROM public.auctions WHERE is_dummy = true;

ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS escrow_state TEXT DEFAULT 'none';

-- Allow ended auctions and dummy wallet IDs
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_wallet_address_length;
ALTER TABLE public.users
  ADD CONSTRAINT users_wallet_address_length
  CHECK (char_length(wallet_address) BETWEEN 8 AND 64);
ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_end_time_future_on_create;

-- Ensure main test wallet exists
INSERT INTO public.users (wallet_address, username, reputation)
VALUES (${sqlStr(MAIN_WALLET)}, 'hype_tester', 0)
ON CONFLICT (wallet_address) DO NOTHING;

-- =============================================================================
-- PART 1 — CLEAN EXISTING DATA
-- =============================================================================
DELETE FROM public.direct_messages;
DELETE FROM public.message_threads;
DELETE FROM public.notifications;
DELETE FROM public.watchlist;
DELETE FROM public.bids;
DELETE FROM public.reviews;
DELETE FROM public.collection_items;
DELETE FROM public.collections;
DELETE FROM public.auctions;

-- =============================================================================
-- PART 3 — 50 AUCTION LISTINGS (is_dummy = true)
-- =============================================================================
`);

const auctionRows = [];
let listingIndex = 0;
let vendorIndex = 0;

for (const category of CATEGORIES) {
  for (const listing of category.listings) {
    listingIndex += 1;
    const vendor = VENDORS[vendorIndex % VENDORS.length];
    vendorIndex += 1;

    const startPrice = (0.05 + (listingIndex % 50) * 0.098).toFixed(3);
    const hasBids = listingIndex % 5 !== 0; // ~80% have bids
    const bidMultiplier = hasBids ? 1 + 0.12 + (listingIndex % 5) * 0.08 : 0;
    const currentBid = hasBids
      ? (parseFloat(startPrice) * bidMultiplier).toFixed(3)
      : startPrice;

    const endHours =
      listingIndex % 7 === 0
        ? 2 + (listingIndex % 5)
        : listingIndex % 3 === 0
          ? 24 + (listingIndex % 12)
          : 72 + (listingIndex % 120);

    const condition = CONDITIONS[listingIndex % CONDITIONS.length];
    const seed = 1000 + listingIndex;

    auctionRows.push({
      id: `gen_random_uuid()`,
      title: listing.title,
      description: listing.desc,
      category: category.name,
      seller_wallet: vendor,
      start_price: startPrice,
      current_bid: currentBid,
      end_interval: `${endHours} hours`,
      condition,
      image_seed: seed,
      item_details: listing.details,
      hasBids,
      listingIndex,
    });
  }
}

const auctionIds = auctionRows.map((_, i) => {
  const hex = createHash("md5").update(`auction-${i + 1}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
});

lines.push(`INSERT INTO public.auctions (
  id, title, description, category, seller_wallet, start_price, current_bid,
  end_time, status, image_url, condition, item_details, is_dummy, created_at
) VALUES`);

auctionRows.forEach((row, i) => {
  const comma = i < auctionRows.length - 1 ? "," : ";";
  lines.push(
    `  ('${auctionIds[i]}', ${sqlStr(row.title)}, ${sqlStr(row.description)}, ${sqlStr(row.category)}, ${sqlStr(row.seller_wallet)}, ${row.start_price}, ${row.start_price}, now() + interval '${row.end_interval}', 'live', ${sqlStr(`https://picsum.photos/seed/${row.image_seed}/400/400`)}, ${sqlStr(row.condition)}, ${sqlJson(row.item_details)}, true, now() - interval '${(i % 14) + 1} days')${comma}`
  );
});

lines.push("");
lines.push("-- =============================================================================");
lines.push("-- PART 4 — BIDS ON ACTIVE LISTINGS");
lines.push("-- =============================================================================");

let mainWalletWins = 0;
const bidInserts = [];

auctionRows.forEach((row, i) => {
  if (!row.hasBids) return;

  const start = parseFloat(row.start_price);
  const numBids = 3 + (i % 6);
  let amount = start;
  const useMainAsWinner = mainWalletWins < 3 && i % 11 === 0;
  if (useMainAsWinner) mainWalletWins += 1;

  for (let b = 0; b < numBids; b++) {
    const increment = 1.05 + (b % 3) * 0.03;
    amount = Math.round(amount * increment * 1000) / 1000;
    const isLast = b === numBids - 1;
    let bidder;
    if (isLast && useMainAsWinner) {
      bidder = MAIN_WALLET;
    } else {
      bidder = VENDORS[(i + b + 1) % VENDORS.length];
      if (bidder === row.seller_wallet) {
        bidder = VENDORS[(i + b + 2) % VENDORS.length];
      }
    }
    const hoursAgo = (numBids - b) * (2 + (i % 5));
    bidInserts.push(
      `  (gen_random_uuid(), '${auctionIds[i]}', ${sqlStr(bidder)}, ${amount.toFixed(3)}, now() - interval '${hoursAgo} hours')`
    );
  }
});

if (bidInserts.length) {
  lines.push("INSERT INTO public.bids (id, auction_id, bidder_wallet, amount, created_at) VALUES");
  lines.push(bidInserts.join(",\n") + ";");
}

lines.push("");
lines.push("-- =============================================================================");
lines.push("-- PART 5 — ENDED AUCTION FOR ESCROW TESTING");
lines.push("-- =============================================================================");
lines.push(`INSERT INTO public.auctions (
  id, title, description, category, seller_wallet, start_price, current_bid,
  end_time, status, image_url, condition, item_details, is_dummy, escrow_state, created_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'PSA 10 1999 Pokémon Pikachu Holo #58 — ESCROW TEST',
  'Test auction for escrow payment flow. PSA 10 gem mint 1999 Pokémon Base Set Pikachu Holo.',
  'Trading Cards',
  'DUMMY_VENDOR_001',
  0.15,
  0.20,
  now() - interval '1 hour',
  'ended',
  'https://picsum.photos/seed/pikachu58/400/400',
  'mint',
  '{"set": "Base Set", "year": "1999", "card_number": "58", "grade": "PSA 10", "grade_score": "10", "grading_company": "PSA", "language": "English", "first_edition": false}'::jsonb,
  false,
  'none',
  now() - interval '3 days'
);`);

lines.push("");
lines.push(`INSERT INTO public.bids (id, auction_id, bidder_wallet, amount, created_at)
VALUES (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', ${sqlStr(MAIN_WALLET)}, 0.20, now() - interval '2 hours');`);

lines.push("");
lines.push(`INSERT INTO public.message_threads (id, auction_id, buyer_wallet, seller_wallet, status, created_at)
VALUES (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', ${sqlStr(MAIN_WALLET)}, 'DUMMY_VENDOR_001', 'active', now());`);

lines.push("");
lines.push("-- =============================================================================");
lines.push("-- PART 6 — REVIEWS FOR ALL 10 VENDORS");
lines.push("-- =============================================================================");

const reviewComments = [
  [5, "Outstanding seller. Item matched photos exactly and arrived faster than expected.", ["fast_shipping", "as_described", "great_packaging"]],
  [5, "Packaging was premium and communication was excellent throughout the transaction.", ["great_packaging", "good_communication", "would_buy_again"]],
  [4, "Great experience overall. Item was authentic and well described.", ["authentic", "as_described", "responsive"]],
  [4, "Smooth purchase from start to finish. Would happily bid again.", ["would_buy_again", "as_described", "fast_shipping"]],
  [5, "Exactly as listed and shipped with care. One of the best vendors on Hype.", ["as_described", "well_packaged", "fast_shipping"]],
  [3, "Item was good but shipping took longer than expected. Seller was responsive though.", ["as_described", "responsive", "good_communication"]],
  [4, "Solid transaction. Condition was even better than I expected in person.", ["great_condition", "as_described", "authentic"]],
  [5, "Top-tier seller. Fast replies and secure packaging every time.", ["responsive", "great_packaging", "would_buy_again"]],
  [4, "Happy with the purchase. Clear photos and honest description.", ["as_described", "authentic", "good_communication"]],
  [3, "Product was fine with minor wear not shown in photos, but seller resolved it quickly.", ["as_described", "responsive", "good_communication"]],
];

const reviewValues = [];
let reviewCount = 0;
VENDORS.forEach((vendor, vi) => {
  const numReviews = 3 + (vi % 5); // 3-7
  for (let r = 0; r < numReviews; r++) {
    reviewCount += 1;
    const template = reviewComments[(vi + r) % reviewComments.length];
    const reviewer =
      r === 0 && vi % 2 === 0
        ? MAIN_WALLET
        : VENDORS[(vi + r + 1) % VENDORS.length];
    const daysAgo = 3 + ((reviewCount * 7) % 87);
    const tags = `{${template[2].map((t) => `"${t}"`).join(",")}}`;
    reviewValues.push(
      `  (gen_random_uuid(), ${sqlStr(vendor)}, ${sqlStr(reviewer)}, NULL, ${template[0]}, ${sqlStr(template[1])}, '${tags}'::text[], now() - interval '${daysAgo} days', true)`
    );
  }
});

lines.push("INSERT INTO public.reviews (id, vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, created_at, is_dummy) VALUES");
lines.push(reviewValues.join(",\n") + ";");

lines.push("");
lines.push("-- Refresh vendor stats after seeding reviews");
lines.push("SELECT public.refresh_vendor_stats(wallet_address) FROM public.users WHERE wallet_address LIKE 'DUMMY_VENDOR_%';");

const outPath = new URL("../supabase/seed-dummy-data.sql", import.meta.url);
writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${auctionRows.length} auctions, ${bidInserts.length} bids, ${reviewValues.length} reviews`);
console.log(outPath.pathname);
