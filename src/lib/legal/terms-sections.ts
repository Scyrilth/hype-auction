export type LegalSectionData = {
  title: string;
  body?: string;
  bullets?: string[];
};

export const termsSections: LegalSectionData[] = [
  {
    title: "1. Introduction",
    body: "Hype Auction is a live auction marketplace for collectibles, sneakers and streetwear built on the Solana blockchain. By connecting your wallet you agree to these terms. We reserve the right to update these terms at any time.",
  },
  {
    title: "2. Eligibility",
    bullets: [
      "Must be 18 years or older",
      "Must have a valid Solana wallet (Phantom recommended)",
      "Must not be located in a jurisdiction where crypto transactions are prohibited",
      "One wallet per user",
    ],
  },
  {
    title: "3. Listings & Items",
    bullets: [
      "Sellers must accurately represent items — condition, grading, authenticity",
      "Photos must be of the actual item being sold",
      "Prohibited items: counterfeit goods, replicas sold as authentic, illegal items, weapons, drugs, stolen goods, adult content",
      "Hype Auction does not verify item authenticity — buyers rely on seller representations",
      "We reserve the right to remove any listing at any time",
    ],
  },
  {
    title: "4. Bidding",
    bullets: [
      "All bids are binding — placing a bid is a commitment to pay if you win",
      "Bids are off-chain until auction ends — winner pays via Phantom wallet",
      "Wallet balance is checked before bid is accepted",
      "Shill bidding (bidding on your own listings) is prohibited",
      "Bid manipulation of any kind is prohibited",
    ],
  },
  {
    title: "5. Payment",
    bullets: [
      "Winner has 3 attempts to pay: 10 minutes, then 2 hours, then 4 hours",
      "Payment is made in SOL via Phantom wallet",
      "SOL is locked in a smart contract escrow — neither party can access it until conditions are met",
      "Shipping cost is included in the total payment amount",
      "USD equivalent shown is an estimate based on live SOL/USD rate",
    ],
  },
  {
    title: "6. Fees",
    bullets: [
      "Platform fee: 4% of total sale amount (item + shipping)",
      "Fee is deducted automatically on escrow release",
      "No listing fees",
      "No buyer fees — fee is paid by seller only",
    ],
  },
  {
    title: "7. Shipping",
    bullets: [
      "Sellers set flat-rate shipping prices in USD, converted to SOL at payment time",
      "Sellers must ship within 5 days of payment confirmation",
      "Sellers must upload tracking number within 5 days",
      "Buyers shipping addresses are shared with sellers only after payment confirms",
      "International shipping availability is set by the seller per listing",
    ],
  },
  {
    title: "8. Escrow & Refunds",
    bullets: [
      "SOL is held in a Solana smart contract and cannot be accessed by Hype Auction",
      "Path 1 (tracking uploaded): once delivered, buyer has 3 days to confirm receipt or SOL auto-releases to seller",
      "Path 2 (no tracking by day 7): order is flagged, admin reviews, may issue refund after checking estimated delivery plus grace period",
      "Grace periods: domestic orders +5 days, international orders +14 days beyond estimated delivery",
      "Refunds are processed by admin triggering the smart contract",
      "All sales are final once SOL is released to seller",
    ],
  },
  {
    title: "9. Disputes",
    bullets: [
      "Buyers may open a dispute within the 3-day confirmation window after delivery",
      "Disputes are reviewed by Hype Auction admin",
      "Admin decision is final and binding",
      "Evidence from the message thread will be considered",
      "Hype Auction reserves the right to resolve disputes at its discretion",
    ],
  },
  {
    title: "10. Buyer Strike System",
    bullets: [
      "Failure to pay after winning results in a strike on your wallet address",
      "Strike 1: warning + 24 hour bidding cooldown",
      "Strike 2 (within 60 days): 7 day bidding suspension",
      "Strike 3: permanent ban from bidding",
      "Strikes are tied to wallet address and follow the buyer across accounts",
      "Strikes expire after 6 months of good behaviour",
      "Permanent bans may be appealed by contacting support",
    ],
  },
  {
    title: "11. Taxes",
    bullets: [
      "Hype Auction does not collect or remit taxes on behalf of users",
      "Buyers and sellers are solely responsible for applicable taxes in their jurisdiction",
      "Crypto transactions may be subject to capital gains tax — consult a tax professional",
      "USD values shown are estimates and should not be used for tax reporting",
    ],
  },
  {
    title: "12. Prohibited Conduct",
    bullets: [
      "Shill bidding or bid manipulation",
      "Creating fake reviews",
      "Harassing other users via messaging",
      "Attempting to complete transactions outside the platform",
      "Circumventing the escrow system",
      "Using the platform if banned",
      "Exploiting bugs or vulnerabilities",
    ],
  },
  {
    title: "13. Intellectual Property",
    bullets: [
      "Hype Auction and its logo are our property",
      "Users retain ownership of content they upload",
      "By uploading content you grant us a licence to display it on the platform",
    ],
  },
  {
    title: "14. Limitation of Liability",
    bullets: [
      "Hype Auction is not responsible for item authenticity",
      "Hype Auction is not responsible for losses due to SOL price fluctuations",
      "Hype Auction is not responsible for failed transactions due to network congestion",
      "Hype Auction liability is limited to the platform fee paid on that transaction",
      "Use the platform at your own risk",
    ],
  },
  {
    title: "15. Governing Law",
    body: "These terms are governed by applicable law. Disputes regarding these terms shall be resolved through good faith negotiation first.",
  },
  {
    title: "16. Contact",
    body: "For support, disputes or appeals contact us via the platform messaging system or at support@hypeauction.com",
  },
];
