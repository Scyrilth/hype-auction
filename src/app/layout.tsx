import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          <ToastProvider>
            <UserSync />
            {children}
          </ToastProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
