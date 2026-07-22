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
      {
        question: "What is Buy Now?",
        answer:
          "Buy Now is a fixed price option sellers can set alongside their auction starting bid. If a Buy Now price is set, any buyer can purchase the item instantly at that price without waiting for the auction to end. Normal payment and escrow flow applies. Coming soon.",
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
      {
        question: "What happens if I receive an offer as the next highest bidder?",
        answer:
          "If the original winner of an auction fails to pay, the seller may offer the item to you as the next highest bidder. You will receive a notification with 2 hours to accept or decline. Declining carries no penalty — you are free to pass without any strike or consequence. A strike is only issued if you accept the offer and then fail to complete payment within 2 hours.",
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
            body: "Click Pay Now in your message thread. Phantom opens — approve the transaction. SOL (item price plus shipping) locks into smart contract escrow. If you miss this window you get a 2nd attempt with a 2 hour window, then a 3rd with a 4 hour window. Miss all three and a strike is issued. The seller is then notified and can choose to offer the item to the next highest bidder or relist it.",
          },
          {
            title: "Step 3 — Seller ships (within 7 days)",
            body: "Seller receives payment confirmation and must ship within 7 days. They upload the tracking number and carrier to the platform. Both buyer and seller can see tracking status in their message thread.",
          },
          {
            title: "Step 4 — Seller reminder",
            body: "If no tracking is uploaded within a few days of payment, the seller receives a one-time reminder notification to ship the order.",
          },
          {
            title: "Step 5 — Day 7 admin review",
            body: "If tracking still isn't uploaded by day 7, the order is flagged for admin review, who can trigger a refund to your wallet. This is currently a manual admin-reviewed process, not fully automatic.",
          },
          {
            title: "Step 6 — Delivery and confirmation",
            body: "Once your item arrives, click Confirm Receipt in your message thread. If you do not confirm within 3 days of delivery, SOL auto-releases to the seller. If there is an issue with the item, open a dispute within those 3 days before confirming.",
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
        question: "Do I need to pay for shipping out of pocket?",
        answer:
          "Yes, for now. Because your SOL is held in a trustless smart contract rather than a centralized payment system, Hype Auction can't front a prepaid shipping label the way some marketplaces do. You'll cover the shipping cost yourself when you ship, and receive the full item + shipping amount once the buyer confirms receipt (or automatically after 3 days). Many sellers use a crypto debit card to spend SOL directly on postage without cashing out to a bank first — see our Seller Guide for details. Note: crypto debit cards typically require identity verification (KYC) and may charge a small one-time card issuance fee — check the provider's terms before signing up.",
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
      {
        question: "What happens if the winner of my auction doesn't pay?",
        answer:
          "After all payment windows expire, you will receive a notification in your dashboard. You can view the top next highest bidders and their bid amounts, then choose to offer the item to the next highest bidder or relist it as a new auction. If you relist, all previous bidders are automatically notified.",
      },
      {
        question: "Can I end my auction early?",
        answer:
          "Yes. From your seller dashboard, click End Auction on any active listing. If no bids have been placed, the listing closes immediately with no further action. If bids exist, you will be asked to confirm and provide a reason — the current highest bidder is immediately declared the winner and normal payment flow begins. Ending early with bids is permanent and cannot be undone.",
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
          "If tracking isn't uploaded within a few days, the seller gets a reminder. If it still isn't shipped by day 7, the order is flagged for admin review, who can trigger a refund to your wallet. This is currently a manual admin-reviewed process, not fully automatic. We're planning to add automated tracking verification and in-platform shipping label creation in a future update, to make fulfillment faster and more reliable for both buyers and sellers.",
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
