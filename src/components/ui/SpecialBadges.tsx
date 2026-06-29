import { getSpecialBadges, type SpecialBadgeType } from "@/lib/special-badges";

const BADGE_STYLES: Record<
  SpecialBadgeType,
  { label: string; icon: string; className: string }
> = {
  founder: {
    label: "Founder",
    icon: "⚡",
    className:
      "bg-gradient-to-r from-violet-600/80 to-purple-500/80 text-purple-100",
  },
  admin: {
    label: "Admin",
    icon: "🛡️",
    className: "bg-gradient-to-r from-red-600/80 to-orange-500/80 text-orange-50",
  },
};

function SpecialBadge({ type }: { type: SpecialBadgeType }) {
  const style = BADGE_STYLES[type];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.className}`}
    >
      <span aria-hidden>{style.icon}</span>
      {style.label}
    </span>
  );
}

export default function SpecialBadges({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const badges = getSpecialBadges(walletAddress);

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => (
        <SpecialBadge key={badge} type={badge} />
      ))}
    </>
  );
}
