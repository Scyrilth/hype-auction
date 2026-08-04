"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import EditCollectionModal from "@/components/collections/EditCollectionModal";
import BackButton from "@/components/ui/BackButton";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { Collection, CollectionWithOwner } from "@/lib/collections";
import {
  deleteCollection,
  getCollectionsByWallet,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";

export default function ManageCollectionsView() {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const wallet = publicKey?.toBase58();

  const [collections, setCollections] = useState<CollectionWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] =
    useState<CollectionWithOwner | null>(null);
  const [sort, setSort] = useState<"date" | "name" | "value">("date");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const collectionCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const collection of collections) {
      for (const category of collection.categories) {
        if (category.trim()) categories.add(category.trim());
      }
    }
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [collections]);

  const sortedCollections = useMemo(() => {
    let list = [...collections];
    if (categoryFilter !== "all") {
      list = list.filter((collection) =>
        collection.categories.includes(categoryFilter)
      );
    }

    switch (sort) {
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "value":
        return list.sort((a, b) => b.item_count - a.item_count);
      case "date":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [collections, sort, categoryFilter]);

  const loadCollections = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const data = await getCollectionsByWallet(wallet, wallet, client);
      setCollections(data);
    } catch (error) {
      logSupabaseError("ManageCollectionsView.load", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [client, showToast, wallet]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCollectionUpdated = (updated: Collection) => {
    setCollections((current) =>
      current.map((collection) =>
        collection.id === updated.id
          ? { ...collection, ...updated }
          : collection
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (!wallet) return;
    setDeletingId(id);
    try {
      await deleteCollection(id, wallet, client);
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
          <h1 className="text-xl font-bold text-white">My Collections</h1>
        </div>
        <Link
          href="/collections/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          New Collection
        </Link>
      </div>

      {collections.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            Sort
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "date" | "name" | "value")
              }
              className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-white"
            >
              <option value="date">Date added (newest first)</option>
              <option value="value">Estimated value (highest first)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </label>
          {collectionCategories.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted">
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-white"
              >
                <option value="all">All categories</option>
                {collectionCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

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
          {sortedCollections.map((collection) => (
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
                  <button
                    type="button"
                    onClick={() => setEditingCollection(collection)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-accent/40"
                  >
                    Edit
                  </button>
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

      {wallet && editingCollection && (
        <EditCollectionModal
          open={Boolean(editingCollection)}
          onClose={() => setEditingCollection(null)}
          collection={editingCollection}
          wallet={wallet}
          onUpdated={handleCollectionUpdated}
        />
      )}
    </div>
  );
}
