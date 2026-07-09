export type LegalSectionData = {
  title: string;
  body?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const termsSections: LegalSectionData[] = [
  {
    title: "1. Introduction",
    body: "Hype Auction is a live auction marketplace for collectibles, sneakers, and streetwear built on the Solana blockchain, accessible at hypeauction.com. By connecting your wallet or using any part of this platform you agree to these Terms of Service in full. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.",
  },
  {
    title: "2. Definitions",
    bullets: [
      "Platform — hypeauction.com and all associated services.",
      "Seller — any user who creates and lists an auction.",
      "Buyer — any user who places a bid or wins an auction.",
      "Escrow — the on-chain Solana smart contract holding SOL during a transaction.",
      "SOL — Solana blockchain native currency used for all transactions on this platform.",
      "Listing — an item posted for auction by a seller.",
      "Transaction — the full lifecycle from auction end to fund release or refund.",
      "Smart Contract — the deployed Solana program that enforces all payment and escrow logic automatically.",
    ],
  },
  {
    title: "3. Eligibility",
    body: "To use Hype Auction you must:",
    bullets: [
      "Be at least 18 years old",
      "Have a valid Solana wallet (Phantom recommended)",
      "Not be located in a jurisdiction where cryptocurrency transactions are prohibited or restricted",
      "Not be on any OFAC sanctions list or equivalent",
      "Not be a previously banned user attempting to re-register",
    ],
    paragraphs: [
      "By connecting your wallet you represent that you meet all eligibility requirements. One wallet address constitutes one account.",
    ],
  },
  {
    title: "4. Platform Role and Limitations",
    paragraphs: [
      "Hype Auction is a technology platform and marketplace venue only. We are not a party to any transaction between buyers and sellers. We do not buy, sell, or hold any items listed on the platform.",
      "We do not hold user funds. All payments are processed by a trustless on-chain Solana smart contract. The platform has no ability to access, freeze, or redirect funds held in escrow beyond the permissions defined in the smart contract.",
      "We are not responsible for:",
    ],
    bullets: [
      "The accuracy, quality, safety, or legality of any listing",
      "The ability of sellers to sell or buyers to pay",
      "Any loss arising from smart contract bugs, blockchain failures, network congestion, or third-party attacks",
      "Items lost, damaged, or delayed in shipping",
      "Any dispute outcome where evidence is insufficient",
    ],
  },
  {
    title: "5. User Accounts and Wallets",
    paragraphs: [
      "Your account identity is tied to your Solana wallet address. You are solely responsible for maintaining the security of your wallet and private keys. The platform has no ability to recover lost wallets, reset private keys, or reverse on-chain transactions.",
      "You are responsible for all activity conducted through your wallet address. Do not share your private key or seed phrase with anyone, including Hype Auction staff.",
    ],
  },
  {
    title: "6. Listings and Auctions",
    paragraphs: [
      "Sellers are solely responsible for the accuracy of their listings. All items must be accurately described including condition, authenticity, grading, and any known defects.",
      "Prohibited items include but are not limited to:",
    ],
    bullets: [
      "Counterfeit, replica, or fraudulently represented items",
      "Stolen goods",
      "Illegal items under applicable law",
      "Weapons or controlled substances",
      "Adult content",
      "Anything that violates applicable local, national, or international law",
    ],
    body: "Platform reserves the right to remove any listing at any time without notice or liability. By creating a listing, seller represents they own the item and have the full right to sell it.",
  },
  {
    title: "7. Bidding",
    paragraphs: [
      "All bids placed on Hype Auction are binding commitments to purchase if you win. Bids cannot be retracted once placed. Placing a bid confirms your intent and ability to complete the purchase.",
      "The winning bidder has three escalating payment windows: 10 minutes, 2 hours, and 4 hours from auction end. Failure to pay in all three windows results in a strike and the item being offered to the next highest bidder.",
      "Platform enforces minimum bid increments that scale with price. Attempting to circumvent bid increment rules will result in bids being rejected.",
    ],
  },
  {
    title: "8. End Auction Early",
    paragraphs: [
      "Sellers may end their auction early at any time via the seller dashboard.",
      "If bids have been placed: ending early immediately declares the current highest bidder as the winner. Normal payment flow begins and cannot be cancelled. Sellers must provide a reason for ending early. This action is permanent and irreversible.",
      "If no bids have been placed: the listing closes with no winner and no payment flow.",
      "Once a buyer has paid and funds are secured in escrow, the End Auction option is no longer available. The transaction proceeds to completion.",
      "Admin may end any auction at any time for policy, legal, or safety reasons.",
    ],
  },
  {
    title: "9. Payments and Escrow",
    paragraphs: [
      "All payments on Hype Auction are made in SOL on the Solana blockchain. When a buyer completes payment, SOL is locked in a trustless smart contract escrow. Neither the buyer, seller, nor platform can access these funds until the contract conditions are met.",
      "Platform fee: 4% of the winning bid amount only. Shipping costs are excluded from fee calculation. The fee is deducted automatically by the smart contract at the time of fund release and is non-refundable.",
      "SOL to USD conversion rates are calculated at the time of payment using live market data. Exchange rate fluctuations between listing and payment are the buyer's responsibility.",
      "All on-chain transactions are final once confirmed. The platform cannot reverse confirmed blockchain transactions.",
    ],
  },
  {
    title: "10. Shipping and Delivery",
    paragraphs: [
      "Sellers are responsible for shipping items promptly after payment is secured in escrow. Sellers must upload valid tracking information within a reasonable timeframe after payment.",
      "Buyers must provide an accurate shipping address before completing payment. The platform is not responsible for delivery failures caused by incorrect addresses.",
      "International shipping is subject to customs, import duties, and taxes which are the buyer's sole responsibility. Sellers must clearly indicate which countries they ship to.",
      "The platform is not responsible for items lost, damaged, or delayed by carriers. Sellers are responsible for appropriate packaging to prevent transit damage.",
    ],
  },
  {
    title: "11. Buyer Protections",
    paragraphs: [
      "Funds are held in escrow until the buyer confirms receipt. Buyers should only confirm receipt after inspecting the item.",
      "If a seller fails to upload tracking within 7 days of payment being secured, the smart contract's auto_refund instruction may be triggered, returning funds to the buyer automatically.",
      "If an item significantly differs from its listing description, the buyer may raise a dispute before confirming receipt. Platform will review evidence from both parties.",
      "Buyer protection does not apply after the buyer has confirmed receipt or after funds have been automatically released.",
    ],
  },
  {
    title: "12. Seller Protections",
    paragraphs: [
      "Funds are secured in escrow immediately after buyer payment. Sellers have on-chain proof of guaranteed payment before being required to ship.",
      "If a buyer fails to confirm receipt after a reasonable period following delivery, funds are automatically released to the seller via the smart contract's auto_release instruction.",
      "The seller's on-chain tracking upload serves as immutable proof of shipment in any dispute. Platform considers tracking and delivery evidence in all dispute reviews.",
    ],
  },
  {
    title: "13. Disputes",
    paragraphs: [
      "Either party may raise a dispute through the platform's dispute system. Disputes must be raised before confirming receipt or before the auto-release window closes. Once funds have been released no dispute can be raised.",
      "Both parties must provide relevant evidence including photographs, messages, and tracking information. Platform will review all evidence and make a final binding decision. Platform may release funds to either party or issue a partial resolution.",
      "Repeated frivolous or bad faith disputes may result in account suspension.",
    ],
  },
  {
    title: "14. Prohibited Conduct",
    body: "The following are strictly prohibited on Hype Auction:",
    bullets: [
      "Listing counterfeit, stolen, or illegal items",
      "Bid manipulation or shill bidding — placing bids on your own listings directly or through associates",
      "Fee circumvention — transacting outside the platform to avoid fees after connecting through Hype Auction",
      "Harassment, threats, or abusive behaviour toward other users",
      "Creating multiple accounts to evade suspensions or bans",
      "Providing false information in listings, disputes, or communications",
      "Attempting to exploit or manipulate the smart contract",
      "Using the platform from sanctioned jurisdictions",
      "Any fraudulent, deceptive, or misleading activity",
    ],
  },
  {
    title: "15. Strike System and Enforcement",
    body: "Hype Auction operates a progressive strike system:",
    bullets: [
      "Strike 1 — Written warning",
      "Strike 2 — 24 hour account cooldown",
      "Strike 3 — 7 day suspension",
      "Strike 4 — Permanent ban",
    ],
    paragraphs: [
      "Severe violations including fraud, counterfeit goods, or harassment may result in immediate permanent ban without prior strikes.",
      "Bans are tied to wallet addresses and cannot be circumvented by creating new accounts. Platform reserves the right to modify enforcement thresholds at its discretion.",
    ],
  },
  {
    title: "16. Cryptocurrency and Regulatory Notice",
    paragraphs: [
      "Hype Auction operates using Solana (SOL) cryptocurrency. The use of cryptocurrency may be restricted or regulated in certain jurisdictions. It is your sole responsibility to ensure your use of this platform complies with all applicable laws in your country or region.",
      "Hype Auction does not provide financial, legal, or tax advice. By using this platform you confirm that cryptocurrency transactions are lawful in your jurisdiction.",
    ],
  },
  {
    title: "17. Fees",
    bullets: [
      "Current platform fee: 4% of winning bid amount only.",
      "Shipping costs: set by sellers, paid by buyers, excluded from platform fee calculation.",
      "Listing fees: none currently.",
    ],
    paragraphs: [
      "All fees are deducted automatically by the smart contract and are non-refundable. Platform reserves the right to change the fee structure with reasonable notice to users.",
    ],
  },
  {
    title: "18. Intellectual Property",
    paragraphs: [
      "The Hype Auction name, logo, and branding are proprietary. Users retain ownership of content they upload including listing photographs and descriptions. By uploading content you grant Hype Auction a non-exclusive licence to display that content on the platform for the duration it is listed.",
      "You represent that you have the right to upload all content you post and that it does not infringe any third party intellectual property rights.",
    ],
  },
  {
    title: "19. Privacy",
    body: "Data collection and use is governed by our Privacy Policy available at hypeauction.com/privacy. Wallet addresses are public blockchain data. The platform collects minimal personal data — primarily shipping addresses necessary for transaction fulfillment.",
  },
  {
    title: "20. Tax Obligations",
    paragraphs: [
      "Users are solely responsible for determining and paying any taxes applicable to their transactions including capital gains tax, income tax, VAT, or any other applicable tax in their jurisdiction.",
      "Hype Auction does not provide tax advice and is not responsible for any tax obligations arising from platform use. Consult a qualified tax professional for guidance specific to your situation.",
    ],
  },
  {
    title: "21. Sanctions and Restricted Jurisdictions",
    paragraphs: [
      "Hype Auction cannot be used by persons or entities in jurisdictions subject to OFAC sanctions or equivalent restrictions.",
      "By using this platform you represent that you are not subject to any such restrictions and that your use of the platform is lawful in your jurisdiction.",
    ],
  },
  {
    title: "22. Disclaimers and Limitation of Liability",
    body: "This platform is provided as-is with no warranties of any kind. To the maximum extent permitted by law, Hype Auction and its operators are not liable for:",
    bullets: [
      "Any losses arising from smart contract bugs, exploits, or failures",
      "Losses from blockchain network failures or congestion",
      "Losses from hacks or attacks on user wallets",
      "Item quality, condition, or authenticity",
      "Losses arising from reliance on exchange rates",
      "Any indirect, incidental, or consequential damages",
    ],
    paragraphs: [
      "Where liability cannot be excluded, our liability is limited to the platform fees paid in the relevant transaction.",
    ],
  },
  {
    title: "23. Indemnification",
    body: "You agree to indemnify and hold harmless Hype Auction and its operators from any claims, losses, or expenses arising from your use of the platform, your listings, your transactions, your conduct, or your violation of these terms.",
  },
  {
    title: "24. Governing Law and Contact",
    paragraphs: [
      "These terms are governed by applicable law. Any disputes between users and the platform that cannot be resolved informally shall be subject to binding arbitration. Users waive the right to participate in class action lawsuits against the platform.",
      "For all queries: support@hypeauction.com",
      "For disputes: use the in-platform dispute system",
    ],
  },
];
