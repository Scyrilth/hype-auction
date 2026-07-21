import type {
  ShippingProfile,
  ShippingProfileInput,
} from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import { supabase, type SupabaseClient } from "@/lib/supabase";

function parseShippingProfile(row: Record<string, unknown>): ShippingProfile {
  return {
    id: row.id as string,
    seller_wallet: row.seller_wallet as string,
    name: row.name as string,
    category: row.category as string,
    domestic_shipping_usd: Number(row.domestic_shipping_usd ?? 0),
    international_shipping_usd: Number(row.international_shipping_usd ?? 0),
    ships_internationally: Boolean(row.ships_internationally),
    created_at: row.created_at as string,
  };
}

export async function getShippingProfiles(
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<ShippingProfile[]> {
  const { data, error } = await client
    .from("shipping_profiles")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    parseShippingProfile(row as Record<string, unknown>)
  );
}

export async function createShippingProfile(
  sellerWallet: string,
  input: ShippingProfileInput,
  client: SupabaseClient = supabase
): Promise<ShippingProfile> {
  const { data, error } = await client
    .from("shipping_profiles")
    .insert({
      seller_wallet: sellerWallet,
      name: input.name.trim(),
      category: input.category,
      domestic_shipping_usd: input.domestic_shipping_usd,
      international_shipping_usd: input.international_shipping_usd,
      ships_internationally: input.ships_internationally,
    })
    .select()
    .single();

  if (error) {
    logSupabaseError("createShippingProfile", error);
    throw error;
  }

  return parseShippingProfile(data as Record<string, unknown>);
}

export async function updateShippingProfile(
  sellerWallet: string,
  profileId: string,
  input: ShippingProfileInput,
  client: SupabaseClient = supabase
): Promise<ShippingProfile> {
  const { data: existing, error: fetchError } = await client
    .from("shipping_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("seller_wallet", sellerWallet)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Shipping profile not found.");

  const { data, error } = await client
    .from("shipping_profiles")
    .update({
      name: input.name.trim(),
      category: input.category,
      domestic_shipping_usd: input.domestic_shipping_usd,
      international_shipping_usd: input.international_shipping_usd,
      ships_internationally: input.ships_internationally,
    })
    .eq("id", profileId)
    .eq("seller_wallet", sellerWallet)
    .select()
    .single();

  if (error) {
    logSupabaseError("updateShippingProfile", error);
    throw error;
  }

  return parseShippingProfile(data as Record<string, unknown>);
}

export async function deleteShippingProfile(
  sellerWallet: string,
  profileId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { data: existing, error: fetchError } = await client
    .from("shipping_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("seller_wallet", sellerWallet)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Shipping profile not found.");

  const { error } = await client
    .from("shipping_profiles")
    .delete()
    .eq("id", profileId)
    .eq("seller_wallet", sellerWallet);

  if (error) {
    logSupabaseError("deleteShippingProfile", error);
    throw error;
  }
}
