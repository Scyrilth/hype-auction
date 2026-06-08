"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import CollectionItemCard from "@/components/collections/CollectionItemCard";
import type { CollectionItem } from "@/lib/collections";

export default function SortableCollectionItemCard({
  item,
  collectionId,
  wallet,
  onEdit,
  onDeleted,
}: {
  item: CollectionItem;
  collectionId: string;
  wallet: string;
  onEdit: (item: CollectionItem) => void;
  onDeleted: (itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-20" : ""}`}
    >
      <div
        className={`overflow-hidden rounded-2xl ${
          isDragging
            ? "shadow-[0_12px_32px_rgba(0,0,0,0.45)] ring-2 ring-accent/60"
            : ""
        }`}
      >
        <button
          type="button"
          className="absolute left-0 top-0 z-30 flex h-full w-8 cursor-grab items-center justify-center rounded-l-2xl bg-black/50 text-white/90 transition-colors hover:bg-black/70 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <i className="ti ti-grip-vertical text-base" />
        </button>

        <div className="pl-8">
          <CollectionItemCard
            item={item}
            isOwner
            collectionId={collectionId}
            wallet={wallet}
            onEdit={onEdit}
            onDeleted={onDeleted}
          />
        </div>
      </div>
    </div>
  );
}
