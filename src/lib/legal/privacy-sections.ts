import type { LegalSectionData } from "@/lib/legal/terms-sections";

export const privacySections: LegalSectionData[] = [
  {
    title: "What we collect",
    bullets: [
      "Wallet address (required to use the platform)",
      "Username and profile information you provide",
      "Shipping addresses you add to your profile",
      "Listing and bid activity",
      "Messages sent through the platform",
    ],
  },
  {
    title: "What we do NOT collect",
    bullets: [
      "Email address (not required)",
      "Government ID or KYC information",
      "Payment card details (all payments via Solana blockchain)",
      "Browsing history outside of Hype Auction",
    ],
  },
  {
    title: "How we use your data",
    bullets: [
      "To operate the auction platform",
      "To connect buyers and sellers",
      "To process payments via smart contract",
      "To enforce our terms of service and strike system",
      "To display your public profile and listings",
    ],
  },
  {
    title: "Blockchain transparency",
    body: "Wallet addresses and transaction data recorded on the Solana blockchain are publicly visible by nature. This is inherent to how blockchain technology works and is outside our control.",
  },
  {
    title: "Data sharing",
    body: "We share your data only as necessary:",
    bullets: [
      "Your shipping address is shared with the seller only after payment confirms",
      "Supabase — database hosting",
      "Vercel — application hosting",
      "Solana blockchain — transaction settlement",
      "Binance API — SOL/USD price reference (no personal data shared)",
    ],
  },
  {
    title: "Data security",
    bullets: [
      "Shipping addresses and other sensitive fields are stored securely",
      "We use industry-standard security practices",
      "We never sell your data to third parties",
    ],
  },
  {
    title: "Your rights",
    bullets: [
      "You may request deletion of your account data by contacting support",
      "Blockchain transaction data cannot be deleted by nature of the technology",
      "You may update your profile information at any time in settings",
    ],
  },
  {
    title: "Cookies",
    body: "We use minimal cookies for session management only. No advertising or tracking cookies.",
  },
  {
    title: "Contact",
    body: "Privacy questions: support@hypeauction.com",
  },
];
