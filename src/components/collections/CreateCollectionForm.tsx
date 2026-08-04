"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCategoryLabels } from "@/lib/categories";
import { createCollection } from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { getImageExtension } from "@/lib/storage";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1835] px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

const CATEGORY_OPTIONS = getCategoryLabels();

export default function CreateCollectionForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wallet = publicKey?.toBase58();

  const toggleCategory = (category: string) => {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wallet) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("Collection name is required.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const collection = await createCollection(wallet, {
        name: trimmedName,
        description: description.trim() || null,
        cover_image: coverImage || null,
        categories,
        is_public: isPublic,
        allow_comments: isPublic ? allowComments : false,
      }, client);

      showToast("Collection created!");
      router.push(`/collections/${collection.id}`);
    } catch (error) {
      logSupabaseError("CreateCollectionForm", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <label htmlFor="collection-name" className={labelClass}>
          Collection Name *
        </label>
        <input
          id="collection-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My prized pulls"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="collection-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="collection-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell collectors what makes this collection special..."
          rows={4}
          className={inputClass}
        />
      </div>

      {wallet && (
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
      )}

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
                    : "border border-white/10 bg-[#1a1835] text-zinc-300 hover:border-accent/40"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#1a1835] p-4">
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

      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isSubmitting ? "Creating..." : "Create Collection"}
      </button>
    </form>
  );
}
