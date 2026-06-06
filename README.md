# Hype Auction

A Solana dApp for live-streamed crypto auctions, built with Next.js, TypeScript, Tailwind CSS, and the Solana Wallet Adapter.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Blockchain:** Solana (`@solana/web3.js`)
- **Wallet:** Phantom via `@solana/wallet-adapter-react`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Solana Configuration

The app connects to Solana **devnet** by default. To change the network, edit the `endpoint` in `src/components/WalletContextProvider.tsx`:

```ts
const endpoint = useMemo(() => clusterApiUrl("mainnet-beta"), []);
```

Or pass a custom RPC URL (e.g. from [Helius](https://helius.dev)):

```ts
const endpoint = useMemo(() => "https://your-rpc-url", []);
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with wallet provider
│   ├── page.tsx        # Landing page
│   └── globals.css     # Tailwind + theme variables
└── components/
    ├── WalletContextProvider.tsx  # Solana connection + wallet setup
    └── WalletButton.tsx           # Connect wallet button (SSR-safe)
```
