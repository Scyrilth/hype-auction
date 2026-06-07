import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { WatchlistProvider } from "@/components/auction/WatchlistProvider";
import { ToastProvider } from "@/components/ui/Toast";
import UserSync from "@/components/UserSync";
import WalletContextProvider from "@/components/WalletContextProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIVEAUCTION — Live Auctions on Solana",
  description: "Live-streamed crypto auctions with on-chain escrow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          <ToastProvider>
            <WatchlistProvider>
              <UserSync />
              {children}
            </WatchlistProvider>
          </ToastProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
