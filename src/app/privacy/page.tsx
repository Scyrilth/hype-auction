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
    <AppShell contentClassName="flex-1 p-4 sm:p-5">
      <LegalPageLayout
        title="Privacy Policy"
        subtitle="Last updated: June 2026"
        current="privacy"
      >
        {privacySections.map((section) => (
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
