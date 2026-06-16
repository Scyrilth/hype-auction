import Link from "next/link";

const links = [
  { href: "/tos", label: "Terms of Service", key: "tos" },
  { href: "/privacy", label: "Privacy Policy", key: "privacy" },
  { href: "/faq", label: "FAQ", key: "faq" },
] as const;

export default function LegalCrossLinks({
  current,
}: {
  current: (typeof links)[number]["key"];
}) {
  const others = links.filter((link) => link.key !== current);

  return (
    <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
      Also see:{" "}
      {others.map((link, index) => (
        <span key={link.href}>
          {index > 0 && " | "}
          <Link
            href={link.href}
            className="font-medium text-accent transition-colors hover:text-purple-300"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
