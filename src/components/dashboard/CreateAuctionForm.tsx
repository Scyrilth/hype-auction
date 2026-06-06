"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  AUCTION_CATEGORIES,
  AUCTION_DURATIONS,
  createAuction,
} from "@/lib/seller";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export default function CreateAuctionForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(AUCTION_CATEGORIES[0]);
  const [startPrice, setStartPrice] = useState("");
  const [durationHours, setDurationHours] = useState(
    String(AUCTION_DURATIONS[3].hours)
  );
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) return;

    const price = parseFloat(startPrice);
    if (!title.trim() || isNaN(price) || price <= 0) {
      showToast("Enter a valid title and starting bid.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAuction({
        sellerWallet: publicKey.toBase58(),
        title,
        description,
        category,
        startPrice: price,
        durationHours: parseInt(durationHours, 10),
        imageUrl,
      });

      setTitle("");
      setDescription("");
      setCategory(AUCTION_CATEGORIES[0]);
      setStartPrice("");
      setDurationHours(String(AUCTION_DURATIONS[3].hours));
      setImageUrl("");

      onCreated();
      showToast("Auction created successfully!");
    } catch (error) {
      logSupabaseError("CreateAuctionForm", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="text-lg font-semibold text-white">Create New Listing</h2>
      <p className="mt-1 text-sm text-muted">
        List an item for live auction. Bids are recorded off-chain for now.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Item title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1999 Pokemon Pikachu Holo #58"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item, condition, authenticity..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {AUCTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startPrice" className={labelClass}>
            Starting bid (SOL)
          </label>
          <input
            id="startPrice"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={startPrice}
            onChange={(e) => setStartPrice(e.target.value)}
            placeholder="1.00"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="duration" className={labelClass}>
            Auction duration
          </label>
          <select
            id="duration"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className={inputClass}
          >
            {AUCTION_DURATIONS.map(({ label, hours }) => (
              <option key={hours} value={hours}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="imageUrl" className={labelClass}>
            Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isSubmitting ? "Creating..." : "Create Auction"}
      </button>
    </form>
  );
}
