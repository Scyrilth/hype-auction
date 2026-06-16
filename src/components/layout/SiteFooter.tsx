import Link from "next/link";

const footerLinks = [
  { href: "/tos", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/faq", label: "FAQ" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-border/50 px-4 py-3 sm:px-5">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-muted sm:text-xs">
        {footerLinks.map((link, index) => (
          <span key={link.href} className="inline-flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">·</span>}
            <Link
              href={link.href}
              className="transition-colors hover:text-zinc-300"
            >
              {link.label}
            </Link>
          </span>
        ))}
        <span aria-hidden="true">·</span>
        <span>© 2026 Hype Auction</span>
      </p>
    </footer>
  );
}
