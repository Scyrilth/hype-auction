"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import CollectionCard from "@/components/collections/CollectionCard";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  getCollectionsByWallet,
  type CollectionWithOwner,
} from "@/lib/collections";
import { logSupabaseError } from "@/lib/errors";

export default function ProfileCollectionsTab({
  profileWallet,
  isOwner,
}: {
  profileWallet: string;
  isOwner: boolean;
}) {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const viewerWallet = publicKey?.toBase58();

  const [collections, setCollections] = useState<CollectionWithOwner[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCollectionsByWallet(profileWallet, viewerWallet, client);
      setCollections(data);
    } catch (error) {
      logSupabaseError("ProfileCollectionsTab", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [client, profileWallet, viewerWallet]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-12">
        <p className="text-sm text-muted">Loading collections...</p>
      </div>
    );
  }

  return (
    <div>
      {isOwner && (
        <div className="mb-4 flex justify-end">
          <Link
            href="/collections/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            New Collection
          </Link>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-12 text-center">
          {isOwner ? (
            <>
              <p className="text-sm text-muted">
                You have no collections yet. Create your first one!
              </p>
              <Link
                href="/collections/new"
                className="mt-4 inline-block text-sm font-medium text-accent transition-colors hover:text-purple-300"
              >
                Create Collection →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">No public collections yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection.id} className="relative">
              {!collection.is_public && isOwner && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-zinc-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Private
                </span>
              )}
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
