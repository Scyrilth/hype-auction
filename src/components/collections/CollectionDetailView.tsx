"use client";

import Image from "next/image";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import AddCollectionItemModal from "@/components/collections/AddCollectionItemModal";
import CollectionItemsToolbar from "@/components/collections/CollectionItemsToolbar";
import CollectionShareButton from "@/components/collections/CollectionShareButton";
import CollectionItemCard from "@/components/collections/CollectionItemCard";
import EditCollectionModal from "@/components/collections/EditCollectionModal";
import SortableCollectionItemCard from "@/components/collections/SortableCollectionItemCard";
import FollowButton from "@/components/shop/FollowButton";
import BackButton from "@/components/ui/BackButton";
import FiatValue from "@/components/ui/FiatValue";
import PortalInfoTooltip from "@/components/ui/PortalInfoTooltip";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import type {
  Collection,
  CollectionComment,
  CollectionDetail,
  CollectionItem,
} from "@/lib/collections";
import {
  addCollectionComment,
  getCollectionById,
  getCollectionComments,
  incrementCollectionViews,
  isCollectionPrivateToViewer,
  toggleCollectionLike,
  updateItemOrder,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { isFollowing } from "@/lib/follows";
import { displaySocialHandle, formatSol, formatTimeAgo } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";
import {
  filterCollectionItems,
  getCollectionItemCategories,
  sortCollectionItems,
  type CollectionGradeFilter,
  type CollectionSortOption,
} from "@/lib/collection-filters";
import { isPhantomWalletAvailable } from "@/lib/wallet-detection";

export default function CollectionDetailView({
  collectionId,
}: {
  collectionId: string;
}) {
  const { publicKey, connected, wallets } = useWallet();
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
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [sort, setSort] = useState<CollectionSortOption>("date");
  const [gradeFilter, setGradeFilter] = useState<CollectionGradeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        if (isPhantomWalletAvailable(wallets)) {
          showToast("Connect your wallet to like collections.", "error");
        }
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

  const handleItemAdded = (item: CollectionItem) => {
    setCollection((current) =>
      current
        ? {
            ...current,
            items: [...current.items, item],
            item_count: current.item_count + 1,
          }
        : current
    );
  };

  const handleItemUpdated = (item: CollectionItem) => {
    setCollection((current) =>
      current
        ? {
            ...current,
            items: current.items.map((existing) =>
              existing.id === item.id ? item : existing
            ),
          }
        : current
    );
  };

  const handleItemDeleted = (itemId: string) => {
    setCollection((current) =>
      current
        ? {
            ...current,
            items: current.items.filter((item) => item.id !== itemId),
            item_count: Math.max(current.item_count - 1, 0),
          }
        : current
    );
  };

  const totalEstimatedValue = useMemo(
    () =>
      (collection?.items ?? []).reduce((sum, item) => {
        if (item.estimated_value_sol != null && item.estimated_value_sol > 0) {
          return sum + item.estimated_value_sol;
        }
        return sum;
      }, 0),
    [collection?.items]
  );

  const hasEstimatedValues = totalEstimatedValue > 0;

  const itemCategories = useMemo(
    () => getCollectionItemCategories(collection?.items ?? []),
    [collection?.items]
  );

  const displayItems = useMemo(() => {
    const items = collection?.items ?? [];
    return sortCollectionItems(
      filterCollectionItems(items, gradeFilter, categoryFilter),
      sort
    );
  }, [collection?.items, gradeFilter, categoryFilter, sort]);

  const itemIds = useMemo(
    () => displayItems.map((item) => item.id),
    [displayItems]
  );

  const handleCollectionUpdated = (updated: Collection) => {
    setCollection((current) =>
      current ? { ...current, ...updated } : current
    );
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !collection || !wallet) return;

      const oldIndex = collection.items.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = collection.items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(collection.items, oldIndex, newIndex).map(
        (item, index) => ({ ...item, display_order: index })
      );

      setCollection((current) =>
        current ? { ...current, items: reordered } : current
      );

      try {
        await updateItemOrder(
          collectionId,
          reordered.map((item) => item.id),
          wallet
        );
      } catch (error) {
        logSupabaseError("CollectionDetailView.reorder", error);
        showToast(getErrorMessage(error), "error");
        loadCollection();
      }
    },
    [collection, collectionId, loadCollection, showToast, wallet]
  );

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!connected || !wallet) {
      try {
        await connectPhantom();
      } catch {
        // Install prompt or user decline handled by connect flow.
      }
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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
          <CollectionShareButton collectionName={collection.name} />
          {isOwner && wallet && (
            <button
              type="button"
              onClick={() => setEditCollectionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1a1835] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/40 hover:text-white"
            >
              <i className="ti ti-settings text-sm" />
              Edit Collection
            </button>
          )}
        </div>
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
          {hasEstimatedValues && (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <i className="ti ti-coins text-purple-300" />
              <span className="font-medium text-white">
                Est. {formatSol(totalEstimatedValue)}
              </span>
              <FiatValue solAmount={totalEstimatedValue} showTooltip={false} />
              <PortalInfoTooltip
                multiline
                text="Estimated total value is based on owner-provided estimates and may not reflect actual market value. Values are not verified by Hype Auction."
              />
            </span>
          )}
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

        {isOwner && wallet && (
          <button
            type="button"
            onClick={() => setAddItemOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            ＋ Add Item
          </button>
        )}
      </div>

      {collection.items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-12 text-center">
          <p className="text-sm text-muted">No items in this collection yet.</p>
        </div>
      ) : (
        <>
          <CollectionItemsToolbar
            sort={sort}
            onSortChange={setSort}
            grade={gradeFilter}
            onGradeChange={setGradeFilter}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={itemCategories}
          />

          {displayItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-12 text-center">
              <p className="text-sm text-muted">No items match your filters.</p>
            </div>
          ) : isOwner && wallet ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {displayItems.map((item) => (
                <SortableCollectionItemCard
                  key={item.id}
                  item={item}
                  collectionId={collectionId}
                  wallet={wallet}
                  onEdit={setEditingItem}
                  onDeleted={handleItemDeleted}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
          ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {displayItems.map((item) => (
            <CollectionItemCard key={item.id} item={item} />
          ))}
        </div>
          )}
        </>
      )}

      {isOwner && wallet && (
        <>
          <EditCollectionModal
            open={editCollectionOpen}
            onClose={() => setEditCollectionOpen(false)}
            collection={collection}
            wallet={wallet}
            onUpdated={handleCollectionUpdated}
          />
          <AddCollectionItemModal
            open={addItemOpen}
            onClose={() => setAddItemOpen(false)}
            collectionId={collectionId}
            wallet={wallet}
            mode="add"
            onItemAdded={handleItemAdded}
          />
          <AddCollectionItemModal
            open={Boolean(editingItem)}
            onClose={() => setEditingItem(null)}
            collectionId={collectionId}
            wallet={wallet}
            mode="edit"
            initialData={editingItem ?? undefined}
            onItemUpdated={handleItemUpdated}
          />
        </>
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
            <button
              type="button"
              onClick={() => void connectPhantom()}
              className="mb-6 text-sm font-medium text-accent transition-colors hover:text-purple-300"
            >
              Connect your wallet to leave a comment
            </button>
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
