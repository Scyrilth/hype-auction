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
    <AppShell contentClassName="flex-1 p-4 sm:p-5">
      <LegalPageLayout
        title="Terms of Service"
        subtitle="Last updated: June 2026"
        current="tos"
      >
        {termsSections.map((section) => (
          <LegalSection
            key={section.title}
            title={section.title}
            bullets={section.bullets}
          >
            {section.body}
          </LegalSection>
        ))}
      </LegalPageLayout>
    </AppShell>
  );
}
