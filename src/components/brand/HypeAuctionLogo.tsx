import Link from "next/link";

const LOGO_VIEWBOX = "0 0 132 36";

function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Hype Auction"
    >
      <circle cx="18" cy="18" r="16" fill="#7C3AED" />
      <g transform="translate(6, 6) scale(0.67)">
        <path
          d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
          fill="white"
        />
      </g>
      <text
        x="40"
        y="15"
        fill="white"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.06em"
      >
        HYPE
      </text>
      <line
        x1="40"
        y1="19"
        x2="64"
        y2="19"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <text
        x="40"
        y="29"
        fill="#a78bfa"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.1em"
      >
        AUCTION
      </text>
    </svg>
  );
}

export default function HypeAuctionLogo({
  className = "h-9 w-auto",
  showTagline = false,
  asLink = true,
}: {
  className?: string;
  showTagline?: boolean;
  asLink?: boolean;
}) {
  const content = (
    <div className={showTagline ? undefined : "inline-flex"}>
      <LogoSvg className={className} />
      {showTagline && (
        <p className="mt-1.5 text-xs text-muted">Live Auctions. On Solana.</p>
      )}
    </div>
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

/** Circle + bolt mark only (favicon-sized usages). */
export function HypeAuctionMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Hype Auction"
    >
      <circle cx="16" cy="16" r="16" fill="#7C3AED" />
      <g transform="translate(4, 4) scale(0.67)">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="white" />
      </g>
    </svg>
  );
}
