import AppShell from "@/components/layout/AppShell";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import LegalSection from "@/components/legal/LegalSection";
import { privacySections } from "@/lib/legal/privacy-sections";

export const metadata = {
  title: "Privacy Policy — Hype Auction",
  description: "How Hype Auction collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <AppShell contentClassName="flex-1 p-3 sm:p-4">
      <LegalPageLayout
        title="Privacy Policy"
        subtitle="Last updated: July 2026"
        current="privacy"
      >
        {privacySections.map((section) => (
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
