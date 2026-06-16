import AppShell from "@/components/layout/AppShell";
import FaqView from "@/components/legal/FaqView";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { faqCategories } from "@/lib/legal/faq-data";

export const metadata = {
  title: "FAQ — Hype Auction",
  description: "Frequently asked questions about bidding, selling, escrow and more.",
};

export default function FaqPage() {
  return (
    <AppShell contentClassName="flex-1 p-4 sm:p-5">
      <LegalPageLayout
        title="Frequently Asked Questions"
        subtitle="Last updated: June 2026"
        current="faq"
      >
        <FaqView categories={faqCategories} />
      </LegalPageLayout>
    </AppShell>
  );
}
