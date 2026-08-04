"use client";

import { useEffect, useState } from "react";

import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCategoryLabels } from "@/lib/categories";
import {
  updateCollection,
  type Collection,
  type CollectionWithOwner,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { getImageExtension } from "@/lib/storage";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0d0d1a] px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

const CATEGORY_OPTIONS = getCategoryLabels();

export default function EditCollectionModal({
  open,
  onClose,
  collection,
  wallet,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  collection: CollectionWithOwner;
  wallet: string;
  onUpdated: (updated: Collection) => void;
}) {
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [coverImage, setCoverImage] = useState(collection.cover_image ?? "");
  const [categories, setCategories] = useState<string[]>(collection.categories);
  const [isPublic, setIsPublic] = useState(collection.is_public);
  const [allowComments, setAllowComments] = useState(collection.allow_comments);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(collection.name);
    setDescription(collection.description ?? "");
    setCoverImage(collection.cover_image ?? "");
    setCategories(collection.categories);
    setIsPublic(collection.is_public);
    setAllowComments(collection.allow_comments);
  }, [open, collection]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const toggleCategory = (category: string) => {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("Collection name is required.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateCollection(collection.id, wallet, {
        name: trimmedName,
        description: description.trim() || null,
        cover_image: coverImage || null,
        categories,
        is_public: isPublic,
        allow_comments: isPublic ? allowComments : false,
      }, client);

      showToast("Collection updated!");
      onUpdated(updated);
      onClose();
    } catch (error) {
      logSupabaseError("EditCollectionModal", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
        aria-label="Close edit collection modal"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-collection-title"
        className="relative z-10 max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1835] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="edit-collection-title" className="text-lg font-bold text-white">
            Edit Collection
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-collection-name" className={labelClass}>
              Collection Name *
            </label>
            <input
              id="edit-collection-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My prized pulls"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="edit-collection-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="edit-collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell collectors what makes this collection special..."
              rows={4}
              className={inputClass}
            />
          </div>

          <ImageUpload
            label="Cover Image"
            bucket="Avatars"
            variant="banner"
            maxSizeMb={5}
            value={coverImage}
            onChange={setCoverImage}
            buildPath={(file) =>
              `collections/${wallet}/${Date.now()}.${getImageExtension(file)}`
            }
          />

          <div>
            <p className={labelClass}>Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected
                        ? "bg-accent text-white"
                        : "border border-white/10 bg-[#0d0d1a] text-zinc-300 hover:border-accent/40"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0d1a]/60 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Public collection</p>
                <p className="text-xs text-muted">
                  Public collections appear in discovery.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => {
                  setIsPublic(event.target.checked);
                  if (!event.target.checked) setAllowComments(false);
                }}
                className="h-5 w-5 rounded border-white/20 bg-[#0d0d1a] text-accent focus:ring-accent"
              />
            </label>

            {isPublic && (
              <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-white/10 pt-4">
                <div>
                  <p className="text-sm font-medium text-white">Allow comments</p>
                  <p className="text-xs text-muted">
                    Let other collectors comment on your showcase.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(event) => setAllowComments(event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-[#0d0d1a] text-accent focus:ring-accent"
                />
              </label>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
