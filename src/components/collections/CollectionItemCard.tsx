import Image from "next/image";

import type { CollectionItem } from "@/lib/collections";
import { formatSol } from "@/lib/format";
import { resolveAuctionImageUrl } from "@/lib/auction-images";

export default function CollectionItemCard({
  item,
}: {
  item: CollectionItem;
}) {
  const imageSrc =
    item.images[0] ??
    resolveAuctionImageUrl(null, {
      title: item.name,
      category: item.category,
    });

  const gradingBadge =
    item.grading_company && item.grade
      ? `${item.grading_company} ${item.grade}${item.grade_label ? ` — ${item.grade_label}` : ""}`
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835]">
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-purple-900/50 to-[#1a1835]">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="p-3">
        <h4 className="line-clamp-2 text-sm font-semibold text-white">
          {item.name}
        </h4>
        {item.category && (
          <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
            {item.category}
          </span>
        )}
        {gradingBadge && (
          <p className="mt-2 text-[11px] font-semibold text-amber-300">
            {gradingBadge}
          </p>
        )}
        {item.estimated_value_sol != null && item.estimated_value_sol > 0 && (
          <p className="mt-2 text-xs font-semibold text-accent">
            Est. {formatSol(item.estimated_value_sol)}
          </p>
        )}
      </div>
    </div>
  );
}
