import type { LegalSectionData } from "@/lib/legal/terms-sections";

export const privacySections: LegalSectionData[] = [
  {
    title: "1. Introduction",
    body: "Hype Auction (\"we\", \"us\", \"our\") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights in relation to it. By using hypeauction.com you agree to the practices described in this policy.",
  },
  {
    title: "2. Who We Are",
    paragraphs: [
      "Hype Auction is a live auction marketplace for collectibles, sneakers, and streetwear built on the Solana blockchain, accessible at hypeauction.com.",
      "Contact: support@hypeauction.com",
    ],
  },
  {
    title: "3. What Information We Collect",
    body: "The following categories describe the information we collect when you use Hype Auction.",
  },
  {
    title: "3.1 Information you provide directly",
    bullets: [
      "Shipping addresses — collected when you add an address to complete a purchase",
      "Profile information — display name or username if you choose to set one",
      "Communications — messages sent through our messaging system",
      "Listing content — item descriptions, photographs, and details you upload as a seller",
    ],
  },
  {
    title: "3.2 Information collected automatically",
    bullets: [
      "Wallet address — your Solana wallet address when you connect to the platform. Note: wallet addresses are public blockchain data",
      "Usage data — pages visited, features used, time spent on the platform",
      "Device and browser information — browser type, operating system, IP address",
      "Cookies and similar technologies — see Section 7",
    ],
  },
  {
    title: "3.3 Blockchain data",
    paragraphs: [
      "All transactions conducted through our smart contract are recorded permanently on the Solana blockchain and are publicly accessible. This includes wallet addresses, bid amounts, and transaction timestamps. We have no ability to delete or modify on-chain data.",
    ],
  },
  {
    title: "3.4 Information we do not collect",
    bullets: [
      "Government ID or passport information",
      "Bank account or credit card numbers",
      "Social security or national identification numbers",
    ],
  },
  {
    title: "4. How We Use Your Information",
    body: "We use the information we collect to:",
    bullets: [
      "Operate and provide the platform and its features",
      "Process transactions and facilitate escrow",
      "Deliver items to the correct shipping address",
      "Send notifications about your auctions, bids, and transactions",
      "Detect and prevent fraud, abuse, and policy violations",
      "Improve the platform through analytics",
      "Respond to your support requests",
      "Comply with legal obligations",
    ],
    paragraphs: [
      "We do not sell your personal information to third parties. We do not allow advertisers to target you based on your activity on Hype Auction.",
    ],
  },
  {
    title: "5. Legal Basis for Processing (GDPR)",
    body: "For users in the European Economic Area, we process your personal data on the following legal bases:",
    bullets: [
      "Contract performance — processing necessary to provide the platform and fulfill transactions",
      "Legitimate interests — fraud prevention, platform security, and improving our services",
      "Legal obligation — complying with applicable laws",
      "Consent — where you have explicitly consented, such as optional analytics cookies",
    ],
  },
  {
    title: "6. How We Share Your Information",
    paragraphs: [
      "We share your information only in the following circumstances:",
      "With other users: Your wallet address is visible to other users in the context of auctions and transactions. Sellers see buyer shipping addresses for fulfilled transactions only.",
      "With service providers: We use third-party services to operate the platform including:",
    ],
    bullets: [
      "Supabase — database and authentication",
      "Vercel — hosting and deployment",
      "Sentry — error monitoring",
      "Helius — Solana blockchain RPC provider",
      "Binance API — cryptocurrency price data",
    ],
    body: "All service providers are contractually bound to protect your data and use it only as instructed.",
  },
  {
    title: "6.1 Legal and business transfers",
    paragraphs: [
      "For legal reasons: We may disclose information if required by law, court order, or to protect the rights and safety of our users or the platform.",
      "Business transfer: In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction.",
    ],
  },
  {
    title: "7. Cookies and Tracking",
    body: "We use cookies and similar technologies to:",
    bullets: [
      "Keep you signed in to your session",
      "Remember your preferences",
      "Analyse platform usage and performance",
    ],
    paragraphs: [
      "Types of cookies we use:",
      "Essential cookies — required for the platform to function. Cannot be disabled. These include session cookies that keep you logged in.",
      "Analytics cookies — help us understand how the platform is used. Includes Vercel Analytics. These are only set if you accept them via our cookie consent banner.",
      "You can manage your cookie preferences at any time via the cookie consent banner on the platform. Declining analytics cookies will not affect your ability to use any platform features.",
    ],
  },
  {
    title: "8. Data Retention",
    body: "We retain your personal information for as long as your account is active or as needed to provide services. Specifically:",
    bullets: [
      "Shipping addresses — retained until you delete them from your profile",
      "Transaction records — retained for 7 years for legal and accounting purposes",
      "Messages — retained for 2 years after the related transaction is completed",
      "Usage analytics — retained for 13 months",
    ],
    paragraphs: [
      "On-chain blockchain data is permanent and cannot be deleted by us or by you.",
    ],
  },
  {
    title: "9. Your Rights",
    body: "Depending on your location you may have the following rights regarding your personal data:",
    bullets: [
      "Right to access — request a copy of the personal data we hold about you.",
      "Right to rectification — request correction of inaccurate personal data.",
      "Right to erasure — request deletion of your personal data where we have no legal obligation to retain it. Note: on-chain blockchain data cannot be deleted.",
      "Right to restrict processing — request that we limit how we use your data in certain circumstances.",
      "Right to data portability — request your data in a structured, machine-readable format.",
      "Right to object — object to processing based on legitimate interests.",
      "Right to withdraw consent — where processing is based on consent, withdraw it at any time.",
    ],
    paragraphs: [
      "To exercise any of these rights contact us at support@hypeauction.com. We will respond within 30 days.",
    ],
  },
  {
    title: "10. International Data Transfers",
    paragraphs: [
      "Hype Auction operates globally. Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for any such transfers in compliance with applicable data protection law.",
    ],
  },
  {
    title: "11. Children's Privacy",
    paragraphs: [
      "Hype Auction is not intended for users under 18 years of age. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor we will delete it promptly.",
    ],
  },
  {
    title: "12. Security",
    body: "We implement appropriate technical and organisational measures to protect your personal information including:",
    bullets: [
      "Encrypted data transmission (HTTPS)",
      "Row-level security on all database tables",
      "Rate limiting to prevent automated attacks",
      "Regular security monitoring via Sentry",
    ],
    paragraphs: [
      "No method of transmission or storage is 100% secure. We cannot guarantee absolute security but we take reasonable steps to protect your data.",
    ],
  },
  {
    title: "13. Third Party Links",
    paragraphs: [
      "The platform may contain links to third party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before providing any information.",
    ],
  },
  {
    title: "14. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will notify users of material changes via the platform. Continued use after changes constitutes acceptance of the updated policy. The date at the top of this page indicates when it was last updated.",
    ],
  },
  {
    title: "15. Contact Us",
    paragraphs: [
      "For any privacy-related questions, requests, or complaints contact us at:",
      "Email: support@hypeauction.com",
      "Platform: hypeauction.com",
      "We aim to respond to all requests within 30 days.",
    ],
  },
];
