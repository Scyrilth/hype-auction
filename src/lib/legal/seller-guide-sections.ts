import type { LegalSectionData } from "@/lib/legal/terms-sections";

export type SellerGuideSection = LegalSectionData & {
  id?: string;
};

export const sellerGuideSections: SellerGuideSection[] = [
  {
    title: "1. Getting started",
    paragraphs: [
      "Connect your Phantom wallet on Hype Auction. On first connect you'll confirm your age (18+) and accept the Terms of Service and Privacy Policy.",
      "Open Shop Settings from your dashboard sidebar to set your shop country and whether you ship internationally. These defaults apply to new listings, but you can override shipping on each listing.",
      "Complete your shop profile — shop name, avatar, banner, and bio — so buyers trust your storefront before they bid.",
    ],
  },
  {
    title: "2. Creating a listing",
    bullets: [
      "Photos — upload a clear main image plus up to four additional photos. Good lighting and honest condition shots reduce disputes.",
      "Category & details — pick the right category and fill in item-specific fields (size, grade, set, etc.) so buyers know exactly what they're getting.",
      "Price — set a starting bid for auctions, or a fixed Buy Now price for fixed-price listings.",
      "Duration — choose how long the auction runs, or enable Good Till Cancelled (GTC) for listings that stay open until you cancel them.",
      "Shipping cost — enter domestic and, if applicable, international flat-rate shipping in USD. These convert to SOL at payment time using the live rate. You can also apply a saved shipping profile (see Section 6).",
    ],
  },
  {
    title: "3. Choosing a listing type",
    bullets: [
      "Auction — traditional timed auction. Highest bidder when the clock ends wins and enters the payment flow.",
      "Auction + Buy Now — buyers can bid normally, or purchase instantly at your Buy Now price before the auction ends.",
      "Fixed Price — no bidding; the item sells at your set price until purchased or you remove the listing.",
      "Good Till Cancelled (GTC) — the listing stays live indefinitely until you end it manually. Works with auction-style listings where you don't want a fixed end date.",
    ],
  },
  {
    title: "4. Managing bids & sales",
    bullets: [
      "Live bidding — you'll get notifications when someone bids on your item. Watch the auction page or your dashboard for activity.",
      "Payment windows — when an auction ends, the winner has a short window to pay via Phantom. If they miss it, additional windows open before a strike is issued.",
      "Next-bidder offers — if the winner doesn't pay after all windows, you can offer the item to the next highest bidder from your dashboard.",
      "Ending early — you can end an active auction from your dashboard. With no bids, it closes immediately. With bids, the current high bidder wins and payment begins — this cannot be undone.",
    ],
  },
  {
    title: "5. How payment & escrow works",
    paragraphs: [
      "Hype Auction uses a trustless Solana smart contract escrow — your buyer's SOL is locked on-chain, not held by us.",
    ],
    bullets: [
      "Buyer pays — the winner clicks Pay Now and approves the transaction in Phantom. Item price plus shipping locks into escrow.",
      "Seller ships — once payment is secured, ship the item and upload tracking in your message thread.",
      "Buyer confirms — the buyer clicks Confirm Receipt when the item arrives. If they don't confirm within 3 days of delivery, funds auto-release to you.",
      "Fee split — on completion, 96% of the item bid goes to you and 4% is the platform fee. The fee applies to the winning bid only, not to the shipping amount you set.",
    ],
  },
  {
    title: "6. Shipping & fulfillment",
    bullets: [
      "Fulfillment queue — your seller dashboard shows paid orders that still need tracking, sorted by how long they've been waiting.",
      "Shipping profiles — save reusable presets (name, category, domestic/international rates) in Shop Settings and apply them when creating a listing. Fields stay editable after you apply a profile.",
      "Uploading tracking — add carrier and tracking number in the message thread for that order. The buyer is notified automatically.",
      "Ship reminder — if tracking isn't uploaded within a few days of payment, you'll receive a one-time reminder notification to ship soon.",
      "After day 7 — orders without tracking may be flagged for admin review. This is separate from the early reminder and does not automatically refund the buyer.",
    ],
  },
  {
    id: "redotpay",
    title: "7. Paying for shipping with crypto",
    paragraphs: [
      "Since your sale proceeds stay locked in escrow until the buyer confirms receipt, you'll need to front the shipping cost yourself when you ship. Many sellers find it easier to do this directly with crypto instead of cashing out to a bank first.",
      "RedotPay Solana Card — a crypto debit card that lets you spend SOL directly, without converting to a bank account first.",
      "Before you sign up: RedotPay requires identity verification (KYC) and charges a one-time $10 fee to issue a virtual card. It's a separate, KYC'd service — not anonymous like Hype Auction itself.",
    ],
  },
  {
    title: "8. Messages & notifications",
    bullets: [
      "Message threads — each sale opens a thread between you and the buyer for payment, shipping, and support.",
      "System messages vs chat — payment confirmations, tracking updates, and dispute notices appear as system messages. Regular chat is for coordinating with your buyer.",
      "Mark all as read — bulk mark-as-read clears regular chat notifications only. System messages stay unread so you don't miss important order updates.",
      "Notifications — check the bell icon for bids, sales, shipping reminders, and other alerts. Click through to the relevant auction or thread.",
    ],
  },
  {
    title: "9. Reviews & your shop",
    bullets: [
      "Public shop page — your shop has a public URL buyers can follow. Set your username in Shop Settings for a clean link.",
      "Ratings — buyers can leave reviews after completed transactions. Good ratings build trust for future sales.",
      "Followers — buyers can follow your shop to see when you list new items.",
    ],
  },
  {
    title: "10. Strikes & policies",
    paragraphs: [
      "Repeated failure to ship, misrepresented listings, or policy violations can result in warnings, strikes, or account restrictions. Buyers who win and don't pay also receive strikes.",
      "Read the full Terms of Service for prohibited items, dispute rules, and enforcement details.",
    ],
  },
];
