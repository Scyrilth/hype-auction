import Image from "next/image";
import Link from "next/link";

import UserAvatar from "@/components/ui/UserAvatar";
import type { CollectionWithOwner } from "@/lib/collections";
import { displaySocialHandle } from "@/lib/format";

export default function CollectionCard({
  collection,
}: {
  collection: CollectionWithOwner;
}) {
  const ownerLabel =
    collection.owner.shop_name ||
    displaySocialHandle(collection.owner.username) ||
    "Collector";
  const visibleCategories = collection.categories.slice(0, 3);
  const extraCategories = collection.categories.length - visibleCategories.length;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835] transition-colors hover:border-accent/40"
    >
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-900/80 via-[#1a1835] to-indigo-900/60">
        {collection.cover_image ? (
          <Image
            src={collection.cover_image}
            alt={collection.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <UserAvatar
            walletAddress={collection.owner.wallet_address}
            avatarUrl={collection.owner.avatar_url}
            alt={ownerLabel}
            size="sm"
            className="border-2 border-white/20"
          />
          <span className="text-xs font-medium text-white">{ownerLabel}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold text-white">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {collection.description}
          </p>
        )}

        {visibleCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleCategories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300"
              >
                {category}
              </span>
            ))}
            {extraCategories > 0 && (
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-muted">
                +{extraCategories} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-heart text-sm text-purple-300" />
            {collection.like_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="ti ti-layout-grid text-sm text-purple-300" />
            {collection.item_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
