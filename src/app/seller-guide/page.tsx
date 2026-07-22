import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalSection from "@/components/legal/LegalSection";
import { sellerGuideSections } from "@/lib/legal/seller-guide-sections";

const REDOTPAY_URL = "https://url.hk/i/en/wcda2";

export const metadata = {
  title: "Seller Guide — Hype Auction",
  description:
    "How to sell on Hype Auction: listings, escrow, shipping, fulfillment, and more.",
};

export default function SellerGuidePage() {
  return (
    <AppShell contentClassName="flex-1 p-3 sm:p-4">
      <LegalPageLayout
        title="Seller Guide"
        subtitle="Last updated: July 2026"
        current="seller-guide"
      >
        <p className="mb-6 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-muted">
          Everything you need to list, sell, ship, and get paid on Hype Auction.
        </p>

        {sellerGuideSections.map((section) => {
          if (section.id === "redotpay") {
            return (
              <section key={section.title} className="mb-8">
                <h2 className="text-base font-semibold text-purple-300 sm:text-lg">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 text-sm leading-relaxed text-zinc-300"
                  >
                    {paragraph}
                  </p>
                ))}
                <p className="mt-4">
                  <a
                    href={REDOTPAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent transition-colors hover:text-purple-300"
                  >
                    Get a RedotPay Solana Card →
                  </a>
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Hype Auction may earn a referral reward if you sign up through
                  this link. This is an independent third-party service — Hype
                  Auction is not affiliated with RedotPay beyond this referral,
                  and isn&apos;t responsible for their fees, terms, KYC process,
                  or card issuance costs. Using a crypto card is entirely
                  optional.
                </p>
              </section>
            );
          }

          if (section.title === "10. Strikes & policies") {
            return (
              <LegalSection
                key={section.title}
                title={section.title}
                paragraphs={section.paragraphs}
              >
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  <Link
                    href="/tos"
                    className="font-medium text-accent transition-colors hover:text-purple-300"
                  >
                    Read the Terms of Service →
                  </Link>
                </p>
              </LegalSection>
            );
          }

          return (
            <LegalSection
              key={section.title}
              title={section.title}
              paragraphs={section.paragraphs}
              bullets={section.bullets}
            />
          );
        })}
      </LegalPageLayout>
    </AppShell>
  );
}
