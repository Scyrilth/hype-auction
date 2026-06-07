"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import BackButton from "@/components/ui/BackButton";
import { useToast } from "@/components/ui/Toast";
import type { CollectionWithOwner } from "@/lib/collections";
import {
  deleteCollection,
  getCollectionsByWallet,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";

export default function ManageCollectionsView() {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const wallet = publicKey?.toBase58();

  const [collections, setCollections] = useState<CollectionWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const data = await getCollectionsByWallet(wallet, wallet);
      setCollections(data);
    } catch (error) {
      logSupabaseError("ManageCollectionsView.load", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, wallet]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleDelete = async (id: string) => {
    if (!wallet) return;

    setDeletingId(id);
    try {
      await deleteCollection(id, wallet);
      setCollections((current) => current.filter((c) => c.id !== id));
      showToast("Collection deleted.");
      setConfirmId(null);
    } catch (error) {
      logSupabaseError("ManageCollectionsView.delete", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted">Loading your collections...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <BackButton className="mb-2" />
          <h1 className="text-2xl font-bold text-white">My Collections</h1>
        </div>
        <Link
          href="/collections/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          New Collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <i className="ti ti-stack-2 mb-4 text-4xl text-purple-300" />
          <p className="text-base font-semibold text-white">
            No collections yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Create your first collection to showcase your prized items.
          </p>
          <Link
            href="/collections/new"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Create Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835]"
            >
              <Link href={`/collections/${collection.id}`}>
                <div className="relative h-40 bg-gradient-to-br from-purple-900/80 via-[#1a1835] to-indigo-900/60">
                  {collection.cover_image ? (
                    <Image
                      src={collection.cover_image}
                      alt={collection.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 font-bold text-white">
                      {collection.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {collection.item_count} items
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      collection.is_public
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-500/20 text-zinc-300"
                    }`}
                  >
                    {collection.is_public ? "Public" : "Private"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/collections/${collection.id}`}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-accent/40"
                  >
                    Edit
                  </Link>
                  {confirmId === collection.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(collection.id)}
                        disabled={deletingId === collection.id}
                        className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-60"
                      >
                        {deletingId === collection.id
                          ? "Deleting..."
                          : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-muted hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(collection.id)}
                      className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
