import Link from "next/link";

function BrandText() {
  return (
    <div className="flex flex-col">
      <span className="text-[15px] font-bold leading-tight text-white">
        Hype Auction
      </span>
      <span
        className="mt-px text-[9px] leading-tight"
        style={{ color: "#6b5fa0" }}
      >
        Live Auctions. On Solana.
      </span>
    </div>
  );
}

export default function HypeAuctionLogo({
  imageClassName = "h-9 w-auto",
  className = "",
  asLink = true,
  showText = true,
}: {
  imageClassName?: string;
  className?: string;
  asLink?: boolean;
  showText?: boolean;
}) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <img
        src="/hypeauction-logo.png"
        alt="Hype Auction"
        className={imageClassName}
      />
      {showText ? <BrandText /> : null}
    </div>
  );

  if (!asLink) return content;

  return (
    <Link href="/" className="inline-block" aria-label="Hype Auction home">
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
    />
  );
}
