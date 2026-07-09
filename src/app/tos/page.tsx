import AppShell from "@/components/layout/AppShell";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalSection from "@/components/legal/LegalSection";
import { termsSections } from "@/lib/legal/terms-sections";

export const metadata = {
  title: "Terms of Service — Hype Auction",
  description: "Terms and conditions for using Hype Auction.",
};

export default function TermsPage() {
  return (
    <AppShell contentClassName="flex-1 p-3 sm:p-4">
      <LegalPageLayout
        title="Terms of Service"
        subtitle="Last updated: July 2026"
        current="tos"
      >
        <p className="mb-6 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-muted">
          Hype Auction is intended for users aged 18 and over. By using this
          platform, you confirm that you are at least 18 years old.
        </p>

        {termsSections.map((section) => (
          <LegalSection
            key={section.title}
            title={section.title}
            bullets={section.bullets}
            paragraphs={section.paragraphs}
          >
            {section.body}
          </LegalSection>
        ))}
      </LegalPageLayout>
    </AppShell>
  );
}
