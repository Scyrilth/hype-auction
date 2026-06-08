import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export interface CollectionOwner {
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  shop_name: string | null;
}

export interface Collection {
  id: string;
  owner_wallet: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  categories: string[];
  is_public: boolean;
  allow_comments: boolean;
  item_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithOwner extends Collection {
  owner: CollectionOwner;
  liked_by_viewer?: boolean;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  owner_wallet: string;
  name: string;
  category: string | null;
  condition: string | null;
  grading_company: string | null;
  grade: string | null;
  grade_label: string | null;
  year: number | null;
  brand: string | null;
  images: string[];
  notes: string | null;
  estimated_value_sol: number | null;
  verification_url: string | null;
  acquisition_method: string;
  item_details: Record<string, string>;
  display_order: number;
  created_at: string;
}

export interface CollectionComment {
  id: string;
  collection_id: string;
  wallet_address: string;
  content: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
}

export interface CollectionDetail extends CollectionWithOwner {
  items: CollectionItem[];
}

export type CreateCollectionInput = {
  name: string;
  description?: string | null;
  cover_image?: string | null;
  categories?: string[];
  is_public?: boolean;
  allow_comments?: boolean;
};

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export type CollectionItemInput = {
  name: string;
  category?: string | null;
  condition?: string | null;
  grading_company?: string | null;
  grade?: string | null;
  grade_label?: string | null;
  year?: number | null;
  brand?: string | null;
  images?: string[];
  notes?: string | null;
  estimated_value_sol?: number | null;
  verification_url?: string | null;
  acquisition_method?: string;
  item_details?: Record<string, string>;
  display_order?: number;
};

function parseCollection(row: Record<string, unknown>): Collection {
  return {
    id: row.id as string,
    owner_wallet: row.owner_wallet as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    cover_image: (row.cover_image as string | null) ?? null,
    categories: Array.isArray(row.categories)
      ? (row.categories as string[])
      : [],
    is_public: Boolean(row.is_public ?? true),
    allow_comments: Boolean(row.allow_comments ?? true),
    item_count: Number(row.item_count ?? 0),
    like_count: Number(row.like_count ?? 0),
    view_count: Number(row.view_count ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function parseCollectionItem(row: Record<string, unknown>): CollectionItem {
  const details = row.item_details;
  return {
    id: row.id as string,
    collection_id: row.collection_id as string,
    owner_wallet: row.owner_wallet as string,
    name: row.name as string,
    category: (row.category as string | null) ?? null,
    condition: (row.condition as string | null) ?? null,
    grading_company: (row.grading_company as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    grade_label: (row.grade_label as string | null) ?? null,
    year:
      row.year === null || row.year === undefined ? null : Number(row.year),
    brand: (row.brand as string | null) ?? null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    notes: (row.notes as string | null) ?? null,
    estimated_value_sol:
      row.estimated_value_sol === null || row.estimated_value_sol === undefined
        ? null
        : Number(row.estimated_value_sol),
    verification_url: (row.verification_url as string | null) ?? null,
    acquisition_method: (row.acquisition_method as string) ?? "other",
    item_details:
      details && typeof details === "object" && !Array.isArray(details)
        ? (details as Record<string, string>)
        : {},
    display_order: Number(row.display_order ?? 0),
    created_at: row.created_at as string,
  };
}

function parseOwner(row: Record<string, unknown>): CollectionOwner {
  return {
    wallet_address: row.wallet_address as string,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    shop_name: (row.shop_name as string | null) ?? null,
  };
}

async function fetchOwners(
  wallets: string[]
): Promise<Map<string, CollectionOwner>> {
  if (!wallets.length) return new Map();

  const { data, error } = await supabase
    .from("users")
    .select("wallet_address, username, avatar_url, shop_name")
    .in("wallet_address", wallets);

  if (error) throw error;

  const map = new Map<string, CollectionOwner>();
  for (const row of data ?? []) {
    const owner = parseOwner(row as Record<string, unknown>);
    map.set(owner.wallet_address, owner);
  }
  return map;
}

function attachOwner(
  collection: Collection,
  owners: Map<string, CollectionOwner>
): CollectionWithOwner {
  const owner = owners.get(collection.owner_wallet) ?? {
    wallet_address: collection.owner_wallet,
    username: null,
    avatar_url: null,
    shop_name: null,
  };
  return { ...collection, owner };
}

export async function getPublicCollections(filters?: {
  category?: string;
  search?: string;
}): Promise<CollectionWithOwner[]> {
  let query = supabase
    .from("collections")
    .select("*")
    .eq("is_public", true)
    .order("like_count", { ascending: false });

  if (filters?.category && filters.category !== "All") {
    query = query.contains("categories", [filters.category]);
  }

  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const collections = (data ?? []).map((row) =>
    parseCollection(row as Record<string, unknown>)
  );
  const owners = await fetchOwners([
    ...new Set(collections.map((c) => c.owner_wallet)),
  ]);

  return collections.map((collection) => attachOwner(collection, owners));
}

export async function getCollectionsByWallet(
  wallet: string,
  viewerWallet?: string
): Promise<CollectionWithOwner[]> {
  let query = supabase
    .from("collections")
    .select("*")
    .eq("owner_wallet", wallet)
    .order("updated_at", { ascending: false });

  if (viewerWallet !== wallet) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  const collections = (data ?? []).map((row) =>
    parseCollection(row as Record<string, unknown>)
  );
  const owners = await fetchOwners([wallet]);

  return collections.map((collection) => attachOwner(collection, owners));
}

export async function getCollectionById(
  id: string,
  viewerWallet?: string
): Promise<CollectionDetail | null> {
  const { data: row, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const collection = parseCollection(row as Record<string, unknown>);

  if (!collection.is_public && collection.owner_wallet !== viewerWallet) {
    return null;
  }

  const [{ data: itemRows, error: itemsError }, owners, liked] =
    await Promise.all([
      supabase
        .from("collection_items")
        .select("*")
        .eq("collection_id", id)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
      fetchOwners([collection.owner_wallet]),
      viewerWallet
        ? supabase
            .from("collection_likes")
            .select("id")
            .eq("collection_id", id)
            .eq("wallet_address", viewerWallet)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (itemsError) throw itemsError;
  if (liked.error) throw liked.error;

  const withOwner = attachOwner(collection, owners);
  return {
    ...withOwner,
    liked_by_viewer: Boolean(liked.data),
    items: (itemRows ?? []).map((item) =>
      parseCollectionItem(item as Record<string, unknown>)
    ),
  };
}

export async function incrementCollectionViews(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("collections")
    .select("view_count")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!data) return;

  const { error } = await supabase
    .from("collections")
    .update({ view_count: Number(data.view_count ?? 0) + 1 })
    .eq("id", id);

  if (error) throw error;
}

export async function createCollection(
  wallet: string,
  data: CreateCollectionInput
): Promise<Collection> {
  await upsertUser(wallet);

  const { data: row, error } = await supabase
    .from("collections")
    .insert({
      owner_wallet: wallet,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      cover_image: data.cover_image ?? null,
      categories: data.categories ?? [],
      is_public: data.is_public ?? true,
      allow_comments: data.is_public === false ? false : (data.allow_comments ?? true),
    })
    .select("*")
    .single();

  if (error) throw error;
  return parseCollection(row as Record<string, unknown>);
}

export async function updateCollection(
  id: string,
  wallet: string,
  data: UpdateCollectionInput
): Promise<Collection> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.description !== undefined) {
    payload.description = data.description?.trim() || null;
  }
  if (data.cover_image !== undefined) payload.cover_image = data.cover_image;
  if (data.categories !== undefined) payload.categories = data.categories;
  if (data.is_public !== undefined) {
    payload.is_public = data.is_public;
    if (!data.is_public) payload.allow_comments = false;
  }
  if (data.allow_comments !== undefined) payload.allow_comments = data.allow_comments;

  const { data: row, error } = await supabase
    .from("collections")
    .update(payload)
    .eq("id", id)
    .eq("owner_wallet", wallet)
    .select("*")
    .single();

  if (error) throw error;
  return parseCollection(row as Record<string, unknown>);
}

export async function deleteCollection(
  id: string,
  wallet: string
): Promise<void> {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("owner_wallet", wallet);

  if (error) throw error;
}

export async function addCollectionItem(
  collectionId: string,
  wallet: string,
  itemData: CollectionItemInput
): Promise<CollectionItem> {
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("owner_wallet, item_count")
    .eq("id", collectionId)
    .maybeSingle();

  if (collectionError) throw collectionError;
  if (!collection || collection.owner_wallet !== wallet) {
    throw new Error("Collection not found.");
  }

  const { data: row, error } = await supabase
    .from("collection_items")
    .insert({
      collection_id: collectionId,
      owner_wallet: wallet,
      name: itemData.name.trim(),
      category: itemData.category ?? null,
      condition: itemData.condition ?? null,
      grading_company: itemData.grading_company ?? null,
      grade: itemData.grade ?? null,
      grade_label: itemData.grade_label ?? null,
      year: itemData.year ?? null,
      brand: itemData.brand ?? null,
      images: itemData.images ?? [],
      notes: itemData.notes ?? null,
      estimated_value_sol: itemData.estimated_value_sol ?? null,
      verification_url: itemData.verification_url?.trim() || null,
      acquisition_method: itemData.acquisition_method ?? "other",
      item_details: itemData.item_details ?? {},
      display_order: itemData.display_order ?? 0,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: updateError } = await supabase
    .from("collections")
    .update({
      item_count: Number(collection.item_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId);

  if (updateError) throw updateError;

  return parseCollectionItem(row as Record<string, unknown>);
}

export async function updateCollectionItem(
  itemId: string,
  wallet: string,
  itemData: CollectionItemInput
): Promise<CollectionItem> {
  const { data: existing, error: existingError } = await supabase
    .from("collection_items")
    .select("id, owner_wallet")
    .eq("id", itemId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing || (existing.owner_wallet as string) !== wallet) {
    throw new Error("Item not found.");
  }

  const payload: Record<string, unknown> = {};

  if (itemData.name !== undefined) payload.name = itemData.name.trim();
  if (itemData.category !== undefined) payload.category = itemData.category;
  if (itemData.condition !== undefined) payload.condition = itemData.condition;
  if (itemData.grading_company !== undefined) {
    payload.grading_company = itemData.grading_company;
  }
  if (itemData.grade !== undefined) payload.grade = itemData.grade;
  if (itemData.grade_label !== undefined) payload.grade_label = itemData.grade_label;
  if (itemData.year !== undefined) payload.year = itemData.year;
  if (itemData.brand !== undefined) payload.brand = itemData.brand;
  if (itemData.images !== undefined) payload.images = itemData.images;
  if (itemData.notes !== undefined) payload.notes = itemData.notes;
  if (itemData.estimated_value_sol !== undefined) {
    payload.estimated_value_sol = itemData.estimated_value_sol;
  }
  if (itemData.verification_url !== undefined) {
    payload.verification_url = itemData.verification_url?.trim() || null;
  }
  if (itemData.acquisition_method !== undefined) {
    payload.acquisition_method = itemData.acquisition_method;
  }
  if (itemData.item_details !== undefined) payload.item_details = itemData.item_details;
  if (itemData.display_order !== undefined) {
    payload.display_order = itemData.display_order;
  }

  const { data: row, error } = await supabase
    .from("collection_items")
    .update(payload)
    .eq("id", itemId)
    .eq("owner_wallet", wallet)
    .select("*")
    .single();

  if (error) throw error;

  const { error: collectionUpdateError } = await supabase
    .from("collections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", row.collection_id as string);

  if (collectionUpdateError) throw collectionUpdateError;

  return parseCollectionItem(row as Record<string, unknown>);
}

export async function removeCollectionItem(
  itemId: string,
  collectionId: string,
  wallet: string
): Promise<void> {
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("owner_wallet, item_count")
    .eq("id", collectionId)
    .maybeSingle();

  if (collectionError) throw collectionError;
  if (!collection || collection.owner_wallet !== wallet) {
    throw new Error("Collection not found.");
  }

  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("collection_id", collectionId);

  if (error) throw error;

  const { error: updateError } = await supabase
    .from("collections")
    .update({
      item_count: Math.max(Number(collection.item_count ?? 0) - 1, 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId);

  if (updateError) throw updateError;
}

export async function toggleCollectionLike(
  collectionId: string,
  wallet: string
): Promise<{ liked: boolean; likeCount: number }> {
  await upsertUser(wallet);

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("like_count")
    .eq("id", collectionId)
    .maybeSingle();

  if (collectionError) throw collectionError;
  if (!collection) throw new Error("Collection not found.");

  const { data: existing, error: existingError } = await supabase
    .from("collection_likes")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (existingError) throw existingError;

  let liked: boolean;
  let likeCount = Number(collection.like_count ?? 0);

  if (existing) {
    const { error: deleteError } = await supabase
      .from("collection_likes")
      .delete()
      .eq("id", existing.id as string);

    if (deleteError) throw deleteError;
    liked = false;
    likeCount = Math.max(likeCount - 1, 0);
  } else {
    const { error: insertError } = await supabase
      .from("collection_likes")
      .insert({ collection_id: collectionId, wallet_address: wallet });

    if (insertError) throw insertError;
    liked = true;
    likeCount += 1;
  }

  const { error: updateError } = await supabase
    .from("collections")
    .update({ like_count: likeCount })
    .eq("id", collectionId);

  if (updateError) throw updateError;

  return { liked, likeCount };
}

export async function addCollectionComment(
  collectionId: string,
  wallet: string,
  content: string
): Promise<CollectionComment> {
  await upsertUser(wallet);

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("is_public, allow_comments")
    .eq("id", collectionId)
    .maybeSingle();

  if (collectionError) throw collectionError;
  if (!collection?.is_public || !collection.allow_comments) {
    throw new Error("Comments are not allowed on this collection.");
  }

  const { data: row, error } = await supabase
    .from("collection_comments")
    .insert({
      collection_id: collectionId,
      wallet_address: wallet,
      content: trimmed,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { data: user } = await supabase
    .from("users")
    .select("username, avatar_url")
    .eq("wallet_address", wallet)
    .maybeSingle();

  return {
    id: row.id as string,
    collection_id: row.collection_id as string,
    wallet_address: row.wallet_address as string,
    content: row.content as string,
    created_at: row.created_at as string,
    username: (user?.username as string | null) ?? null,
    avatar_url: (user?.avatar_url as string | null) ?? null,
  };
}

export async function getCollectionComments(
  collectionId: string
): Promise<CollectionComment[]> {
  const { data: rows, error } = await supabase
    .from("collection_comments")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const wallets = [...new Set(rows.map((row) => row.wallet_address as string))];
  const owners = await fetchOwners(wallets);

  return rows.map((row) => {
    const owner = owners.get(row.wallet_address as string);
    return {
      id: row.id as string,
      collection_id: row.collection_id as string,
      wallet_address: row.wallet_address as string,
      content: row.content as string,
      created_at: row.created_at as string,
      username: owner?.username ?? null,
      avatar_url: owner?.avatar_url ?? null,
    };
  });
}

export async function isCollectionPrivateToViewer(
  id: string,
  viewerWallet?: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("collections")
    .select("is_public, owner_wallet")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  return (
    !data.is_public && (data.owner_wallet as string) !== viewerWallet
  );
}
