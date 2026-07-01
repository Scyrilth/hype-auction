import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import CookieConsent, {
  ConsentAwareVercelAnalytics,
} from "@/components/CookieConsent";

import { WatchlistProvider } from "@/components/auction/WatchlistProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { WelcomeOnboardingGate } from "@/components/onboarding/WelcomeOnboardingModal";
import UserSync from "@/components/UserSync";
import MobilePhantomTipLoader from "@/components/wallet/MobilePhantomTipLoader";
import WalletContextProvider from "@/components/WalletContextProvider";
import { SidebarUserProvider } from "@/hooks/useSidebarUser";
import {
  buildPageMetadata,
  DEFAULT_DESCRIPTION,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";

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
  metadataBase: new URL(getSiteUrl()),
  verification: {
    google: "EkjLwV4KMPbJRe4ekNFPiyQC9Hkflp1cpo227ZPNi4s",
  },
  icons: {
    icon: "/hypeauction-logo.png",
    apple: "/hypeauction-logo.png",
  },
  ...buildPageMetadata({
    title: `${SITE_NAME} — Live Auctions on Solana`,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
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
          <SidebarUserProvider>
            <ToastProvider>
              <WatchlistProvider>
                <UserSync />
                <WelcomeOnboardingGate />
                <MobilePhantomTipLoader />
                {children}
              </WatchlistProvider>
            </ToastProvider>
          </SidebarUserProvider>
        </WalletContextProvider>
        <CookieConsent />
        <ConsentAwareVercelAnalytics />
      </body>
    </html>
  );
}
