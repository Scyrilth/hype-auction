import BackButton from "@/components/ui/BackButton";
import LegalCrossLinks from "@/components/legal/LegalCrossLinks";

export default function LegalPageLayout({
  title,
  subtitle,
  current,
  children,
}: {
  title: string;
  subtitle: string;
  current: "tos" | "privacy" | "faq";
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl pb-6">
      <BackButton className="mb-4" />

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </header>

      {children}

      <LegalCrossLinks current={current} />
    </div>
  );
}
