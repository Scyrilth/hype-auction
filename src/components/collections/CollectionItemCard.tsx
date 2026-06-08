"use client";

import Image from "next/image";
import { useState } from "react";

import PortalInfoTooltip from "@/components/ui/PortalInfoTooltip";
import { useToast } from "@/components/ui/Toast";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import {
  removeCollectionItem,
  type CollectionItem,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { formatSol } from "@/lib/format";

const ESTIMATE_TOOLTIP =
  "Estimated value set by owner. Not verified by Hype Auction.";

const VERIFIED_TOOLTIP =
  "Owner provided a reference sale to support this estimate";

export default function CollectionItemCard({
  item,
  isOwner = false,
  collectionId,
  wallet,
  onEdit,
  onDeleted,
}: {
  item: CollectionItem;
  isOwner?: boolean;
  collectionId?: string;
  wallet?: string;
  onEdit?: (item: CollectionItem) => void;
  onDeleted?: (itemId: string) => void;
}) {
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const hasEstimate =
    item.estimated_value_sol != null && item.estimated_value_sol > 0;

  const handleDelete = async () => {
    if (!wallet || !collectionId) return;

    setDeleting(true);
    try {
      await removeCollectionItem(item.id, collectionId, wallet);
      onDeleted?.(item.id);
      setConfirmDelete(false);
      showToast("Item removed from collection.");
    } catch (error) {
      logSupabaseError("CollectionItemCard.delete", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  };

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

        {isOwner && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
            {confirmDelete ? (
              <div className="rounded-xl border border-white/10 bg-black/80 p-2 text-center backdrop-blur-sm">
                <p className="mb-2 max-w-[140px] text-[10px] text-white">
                  Remove this item from your collection?
                </p>
                <div className="flex justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-full bg-red-500/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {deleting ? "..." : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label="Edit item"
                >
                  <i className="ti ti-pencil text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label="Delete item"
                >
                  <i className="ti ti-trash text-sm" />
                </button>
              </>
            )}
          </div>
        )}
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
        {hasEstimate && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">
            Est. {formatSol(item.estimated_value_sol!)}
            <PortalInfoTooltip text={ESTIMATE_TOOLTIP} className="text-muted" />
          </p>
        )}
        {item.verification_url && (
          <div className="mt-2 inline-flex items-center gap-1">
            <a
              href={item.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-300 transition-colors hover:text-amber-200"
            >
              Verified ↗
            </a>
            <PortalInfoTooltip text={VERIFIED_TOOLTIP} />
          </div>
        )}
      </div>
    </div>
  );
}
