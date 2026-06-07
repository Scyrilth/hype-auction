"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import CollectionItemCard from "@/components/collections/CollectionItemCard";
import FollowButton from "@/components/shop/FollowButton";
import BackButton from "@/components/ui/BackButton";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import type { CollectionComment, CollectionDetail } from "@/lib/collections";
import {
  addCollectionComment,
  getCollectionById,
  getCollectionComments,
  incrementCollectionViews,
  isCollectionPrivateToViewer,
  toggleCollectionLike,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { isFollowing } from "@/lib/follows";
import { displaySocialHandle, formatTimeAgo } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";

export default function CollectionDetailView({
  collectionId,
}: {
  collectionId: string;
}) {
  const { publicKey, connected } = useWallet();
  const connectPhantom = usePhantomConnect();
  const { showToast } = useToast();
  const wallet = publicKey?.toBase58();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [comments, setComments] = useState<CollectionComment[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [followReady, setFollowReady] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [viewsIncremented, setViewsIncremented] = useState(false);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const privateToViewer = await isCollectionPrivateToViewer(
        collectionId,
        wallet
      );
      if (privateToViewer) {
        setIsPrivate(true);
        setCollection(null);
        setLoading(false);
        return;
      }

      const detail = await getCollectionById(collectionId, wallet);
      if (!detail) {
        setNotFound(true);
        setCollection(null);
        setLoading(false);
        return;
      }

      setIsPrivate(false);
      setNotFound(false);
      setCollection(detail);

      if (detail.is_public && detail.allow_comments) {
        const loadedComments = await getCollectionComments(collectionId);
        setComments(loadedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      logSupabaseError("CollectionDetailView.load", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [collectionId, showToast, wallet]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    let cancelled = false;

    async function checkFollow() {
      if (!collection) {
        setFollowReady(true);
        return;
      }

      if (!wallet) {
        if (!cancelled) {
          setInitialFollowing(false);
          setFollowReady(true);
        }
        return;
      }

      try {
        const following = await isFollowing(
          wallet,
          collection.owner.wallet_address
        );
        if (!cancelled) {
          setInitialFollowing(following);
          setFollowReady(true);
        }
      } catch {
        if (!cancelled) setFollowReady(true);
      }
    }

    setFollowReady(false);
    checkFollow();
    return () => {
      cancelled = true;
    };
  }, [collection, wallet]);

  useEffect(() => {
    if (!collection || viewsIncremented) return;

    incrementCollectionViews(collection.id)
      .then(() => {
        setViewsIncremented(true);
        setCollection((current) =>
          current
            ? { ...current, view_count: current.view_count + 1 }
            : current
        );
      })
      .catch((error) => {
        logSupabaseError("CollectionDetailView.views", error);
      });
  }, [collection, viewsIncremented]);

  const handleLike = async () => {
    if (!connected || !wallet) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click like again.");
      } catch {
        showToast("Connect your wallet to like collections.", "error");
      }
      return;
    }

    setLikeLoading(true);
    try {
      const result = await toggleCollectionLike(collectionId, wallet);
      setCollection((current) =>
        current
          ? {
              ...current,
              liked_by_viewer: result.liked,
              like_count: result.likeCount,
            }
          : current
      );
    } catch (error) {
      logSupabaseError("CollectionDetailView.like", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!connected || !wallet) {
      showToast("Connect your wallet to comment.", "error");
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) return;

    setCommentLoading(true);
    try {
      const comment = await addCollectionComment(collectionId, wallet, trimmed);
      setComments((current) => [comment, ...current]);
      setCommentText("");
    } catch (error) {
      logSupabaseError("CollectionDetailView.comment", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted">Loading collection...</p>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="mx-auto max-w-2xl">
        <BackButton className="mb-6" />
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <i className="ti ti-lock mb-4 text-4xl text-purple-300" />
          <h1 className="text-xl font-bold text-white">
            This collection is private
          </h1>
          <p className="mt-2 text-sm text-muted">
            Only the owner can view this collection.
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="mx-auto max-w-2xl">
        <BackButton className="mb-6" />
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <h1 className="text-xl font-bold text-white">Collection not found</h1>
          <p className="mt-2 text-sm text-muted">
            This collection may have been removed.
          </p>
          <Link
            href="/collections"
            className="mt-4 inline-block text-sm font-medium text-accent hover:text-purple-300"
          >
            Browse collections →
          </Link>
        </div>
      </div>
    );
  }

  const ownerLabel =
    collection.owner.shop_name ||
    displaySocialHandle(collection.owner.username) ||
    "Collector";
  const ownerHref = getProfileHref(
    collection.owner.username,
    collection.owner.wallet_address
  );
  const isOwner = wallet === collection.owner_wallet;
  const showComments =
    collection.is_public && collection.allow_comments;

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton className="mb-6" />

      <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/80 via-[#1a1835] to-indigo-900/60">
        {collection.cover_image ? (
          <Image
            src={collection.cover_image}
            alt={collection.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/80 via-transparent to-transparent" />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#1a1835] p-4">
        <Link href={ownerHref} className="flex items-center gap-3">
          <UserAvatar
            walletAddress={collection.owner.wallet_address}
            avatarUrl={collection.owner.avatar_url}
            alt={ownerLabel}
            size="md"
            className="border-2 border-white/10"
          />
          <div>
            <p className="font-semibold text-white">{ownerLabel}</p>
            <p className="text-xs text-muted">Collector</p>
          </div>
        </Link>
        {!isOwner && followReady && (
          <FollowButton
            vendorWallet={collection.owner.wallet_address}
            initialFollowing={initialFollowing}
            initialFollowersCount={0}
          />
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
        {collection.description && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {collection.description}
          </p>
        )}

        {collection.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {collection.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-purple-300"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="ti ti-layout-grid text-purple-300" />
            {collection.item_count} items
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="ti ti-heart text-purple-300" />
            {collection.like_count} likes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="ti ti-eye text-purple-300" />
            {collection.view_count} views
          </span>
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
              collection.liked_by_viewer
                ? "border-accent bg-accent/20 text-purple-200"
                : "border-white/10 bg-[#0d0d1a] text-white hover:border-accent/40"
            }`}
          >
            <i
              className={`ti ${
                collection.liked_by_viewer ? "ti-heart-filled" : "ti-heart"
              }`}
            />
            {collection.liked_by_viewer ? "Liked" : "Like"}
          </button>
        </div>
      </div>

      {collection.items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-12 text-center">
          <p className="text-sm text-muted">No items in this collection yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {collection.items.map((item) => (
            <CollectionItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {showComments && (
        <section className="mt-10 border-t border-white/10 pt-8">
          <h2 className="mb-4 text-lg font-bold text-white">Comments</h2>

          {connected ? (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#1a1835] px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-muted">
              Connect your wallet to leave a comment.
            </p>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-muted">No comments yet.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => {
                const commenterLabel =
                  displaySocialHandle(comment.username) || "Collector";
                return (
                  <li
                    key={comment.id}
                    className="flex gap-3 rounded-xl border border-white/10 bg-[#1a1835] p-4"
                  >
                    <UserAvatar
                      walletAddress={comment.wallet_address}
                      avatarUrl={comment.avatar_url}
                      alt={commenterLabel}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {commenterLabel}
                        </span>
                        <span className="text-xs text-muted">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">
                        {comment.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
