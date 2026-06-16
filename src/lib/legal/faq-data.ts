export type FaqStep = {
  title: string;
  body: string;
};

export type FaqItem = {
  question: string;
  answer?: string;
  steps?: FaqStep[];
};

export type FaqCategory = {
  title: string;
  items: FaqItem[];
};

export const faqCategories: FaqCategory[] = [
  {
    title: "About Hype Auction",
    items: [
      {
        question: "What is Hype Auction?",
        answer:
          "Hype Auction is a live auction marketplace for rare collectibles, trading cards, sneakers and streetwear built on the Solana blockchain. Think eBay meets Whatnot, but with trustless crypto escrow — your SOL is held by a smart contract, not us.",
      },
      {
        question: "Do I need crypto to use Hype Auction?",
        answer:
          "Yes. All transactions are settled in SOL (Solana native currency). You need a Phantom wallet and SOL to bid and buy. Prices are shown in both SOL and USD equivalent for reference.",
      },
      {
        question: "Is Hype Auction available worldwide?",
        answer:
          "Yes for buying. For selling, availability depends on your ability to ship internationally. Some sellers may only ship domestically to their country.",
      },
      {
        question: "How do I get started?",
        answer:
          "Install the Phantom wallet extension from phantom.app, fund it with SOL, connect your wallet on Hype Auction and start browsing. No email or signup required.",
      },
    ],
  },
  {
    title: "Bidding & Buying",
    items: [
      {
        question: "How does bidding work?",
        answer:
          "Browse live auctions, enter your bid amount (must be higher than current bid) and click Place Bid. Bids are saved off-chain — you only interact with your Phantom wallet once, when you win and pay.",
      },
      {
        question: "Is my bid binding?",
        answer:
          "Yes. Placing a bid is a commitment to pay if you win. Repeatedly winning and not paying results in strikes and eventually a permanent ban.",
      },
      {
        question: "What happens if I am outbid?",
        answer:
          "You receive a notification immediately. You can place a higher bid to retake the lead.",
      },
      {
        question: "What happens when I win an auction?",
        answer:
          "You receive a notification and a message thread opens with the seller. You have 10 minutes to click Pay Now and complete payment via Phantom.",
      },
    ],
  },
  {
    title: "Payment Procedure",
    items: [
      {
        question:
          "What is the full payment process from winning to receiving my item?",
        steps: [
          {
            title: "Step 1 — You win (0 minutes)",
            body: "Auction ends, you are notified immediately via notification and message thread.",
          },
          {
            title: "Step 2 — Pay Now (0 to 10 minutes)",
            body: "Click Pay Now in your message thread. Phantom opens — approve the transaction. SOL (item price plus shipping) locks into smart contract escrow. If you miss this window you get a 2nd attempt with a 2 hour window, then a 3rd with a 4 hour window. Miss all three and a strike is issued, the next highest bidder is offered the item.",
          },
          {
            title: "Step 3 — Seller ships (within 5 days)",
            body: "Seller receives payment confirmation and must ship within 5 days. They upload the tracking number to the platform. You will see shipping status update on your profile.",
          },
          {
            title: "Step 4 — Day 5 warning",
            body: "If no tracking is uploaded by day 5, the seller receives an automatic warning.",
          },
          {
            title: "Step 5 — Day 7 review",
            body: "If still no tracking by day 7, the order is flagged for admin review. Admin checks estimated delivery date plus grace period (domestic +5 days, international +14 days) before deciding on a refund.",
          },
          {
            title: "Step 6 — Delivery and confirmation",
            body: "Once tracking shows Delivered, you have 3 days to click Confirm Receipt. If you do not confirm within 3 days, SOL auto-releases to the seller. If there is an issue with the item, open a dispute within those 3 days.",
          },
          {
            title: "Step 7 — Completion",
            body: "96% of SOL goes to the seller, 4% platform fee. Transaction is recorded permanently on the Solana blockchain.",
          },
        ],
      },
    ],
  },
  {
    title: "Selling",
    items: [
      {
        question: "How do I become a seller?",
        answer:
          "Connect your wallet, go to Shop Settings, add your country and shipping preferences, then create your first listing. No approval required — anyone can sell.",
      },
      {
        question: "What does it cost to sell?",
        answer:
          "No listing fees. Hype Auction takes a 4% fee only when a sale completes successfully. If your item does not sell, you pay nothing.",
      },
      {
        question: "What items can I sell?",
        answer:
          "Trading cards, sneakers, streetwear, collectibles, comics, watches, sports memorabilia and similar items. No counterfeit goods, replicas sold as authentic, illegal items or prohibited content.",
      },
      {
        question: "How do I set shipping prices?",
        answer:
          "In your shop settings, set whether you ship internationally. On each listing, set your domestic and international flat-rate shipping prices in USD. These are converted to SOL at payment time using the live Binance rate.",
      },
      {
        question: "When do I receive my SOL?",
        answer:
          "After the buyer confirms receipt, or automatically after 3 days if they do not confirm. SOL goes directly to your wallet — Hype Auction never holds your funds beyond the escrow period.",
      },
      {
        question: "What if a buyer does not pay?",
        answer:
          "After 3 missed payment windows, the next highest bidder is offered the item. After all bidders pass, you can relist at the average of recent competitive bids.",
      },
    ],
  },
  {
    title: "Escrow & Safety",
    items: [
      {
        question: "Is my SOL safe?",
        answer:
          "Yes. SOL is held in a Solana smart contract (program-derived address). Not even Hype Auction can access it — only the contract instructions can move it, triggered by buyer confirmation, seller shipping, or admin in a dispute.",
      },
      {
        question: "What if the seller does not ship?",
        answer:
          "If no tracking is uploaded by day 7, the order is flagged. Admin reviews and can trigger a full refund to your wallet. The refund executes instantly on-chain.",
      },
      {
        question: "What if the item is not as described?",
        answer:
          "Open a dispute within 3 days of delivery. Admin reviews the message thread evidence and makes a final decision. If you win the dispute, full SOL is refunded to your wallet.",
      },
      {
        question: "Can Hype Auction take my SOL?",
        answer:
          "No. The smart contract only releases SOL to the seller or buyer. Hype Auction only receives the 4% platform fee on completed sales — this is deducted automatically by the smart contract, never manually by us.",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        question: "What wallet do I need?",
        answer:
          "Phantom wallet browser extension. Download at phantom.app. After installing, refresh the Hype Auction page to connect.",
      },
      {
        question: "What network is Hype Auction on?",
        answer:
          "Solana mainnet. Fast transactions, low fees, environmentally efficient.",
      },
      {
        question: "What if my transaction fails?",
        answer:
          "Failed transactions do not charge you. Try again — network congestion occasionally causes failures. If issues persist, contact support.",
      },
      {
        question: "Do I need to pay gas fees?",
        answer:
          "Yes, Solana transaction fees (gas) are very small — typically less than $0.01 per transaction. These are separate from the platform fee and go to Solana network validators, not Hype Auction.",
      },
    ],
  },
  {
    title: "Disputes & Support",
    items: [
      {
        question: "How do disputes work?",
        answer:
          "Open a dispute within 3 days of delivery via your message thread. Provide evidence of the issue. Admin reviews and makes a final decision — either releasing SOL to seller or refunding to buyer.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Via the messaging system on the platform or at support@hypeauction.com. We aim to respond within 24 to 48 hours.",
      },
      {
        question: "Can a ban be appealed?",
        answer:
          "Permanent bans can be appealed by contacting support@hypeauction.com with your wallet address and reason for appeal. We review each case individually.",
      },
      {
        question: "Are there taxes on my purchases or sales?",
        answer:
          "Hype Auction does not collect or remit taxes. You are responsible for reporting any applicable taxes in your jurisdiction. Crypto transactions may be subject to capital gains tax — consult a tax professional.",
      },
    ],
  },
];
