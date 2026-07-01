import Link from "next/link";

export default function HypeAuctionLogo({
  className = "h-9 w-auto",
  asLink = true,
}: {
  className?: string;
  asLink?: boolean;
}) {
  const content = (
    <img
      src="/hypeauction-logo.png"
      alt="Hype Auction"
      className={className}
      style={{ mixBlendMode: "multiply" }}
    />
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      className="inline-block transition-opacity hover:opacity-90"
      aria-label="Hype Auction home"
    >
      {content}
    </Link>
  );
}

/** Circle mark for favicon-sized usages — uses the full brand logo scaled down. */
export function HypeAuctionMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/hypeauction-logo.png"
      alt="Hype Auction"
      className={className}
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
