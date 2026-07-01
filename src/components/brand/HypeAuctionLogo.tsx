"use client";

import Link from "next/link";

const LOGO_BACKGROUND_STYLE = {
  backgroundImage: "url(/hypeauction-logo.png)",
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
} as const;

function LogoMark({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Hype Auction"
      className={`shrink-0 ${className}`.trim()}
      style={LOGO_BACKGROUND_STYLE}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}

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
  imageClassName = "h-9 w-9",
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
      <LogoMark className={imageClassName} />
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
  return <LogoMark className={className} />;
}
