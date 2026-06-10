import type { ShippingAddress, ShippingAddressInput } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

function parseShippingAddress(row: Record<string, unknown>): ShippingAddress {
  return {
    id: row.id as string,
    wallet_address: row.wallet_address as string,
    nickname: row.nickname as string,
    full_name: row.full_name as string,
    address_line1: row.address_line1 as string,
    address_line2: (row.address_line2 as string | null) ?? null,
    city: row.city as string,
    state: (row.state as string | null) ?? null,
    postal_code: row.postal_code as string,
    country: row.country as string,
    phone: (row.phone as string | null) ?? null,
    is_default: Boolean(row.is_default),
    used_for_auction_id: (row.used_for_auction_id as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export function isShippingAddressLocked(address: ShippingAddress): boolean {
  return address.used_for_auction_id !== null;
}

export async function getDefaultShippingAddress(
  walletAddress: string
): Promise<ShippingAddress | null> {
  const addresses = await getShippingAddresses(walletAddress);
  return addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
}

export async function getShippingAddresses(
  walletAddress: string
): Promise<ShippingAddress[]> {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    parseShippingAddress(row as Record<string, unknown>)
  );
}

async function clearDefaultAddresses(walletAddress: string, exceptId?: string) {
  let query = supabase
    .from("shipping_addresses")
    .update({ is_default: false })
    .eq("wallet_address", walletAddress)
    .eq("is_default", true);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function createShippingAddress(
  walletAddress: string,
  input: ShippingAddressInput
): Promise<ShippingAddress> {
  if (input.is_default) {
    await clearDefaultAddresses(walletAddress);
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert({
      wallet_address: walletAddress,
      nickname: input.nickname.trim(),
      full_name: input.full_name.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      city: input.city.trim(),
      state: input.state?.trim() || null,
      postal_code: input.postal_code.trim(),
      country: input.country,
      phone: input.phone?.trim() || null,
      is_default: input.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    logSupabaseError("createShippingAddress", error);
    throw error;
  }

  return parseShippingAddress(data as Record<string, unknown>);
}

export async function updateShippingAddress(
  walletAddress: string,
  addressId: string,
  input: ShippingAddressInput
): Promise<ShippingAddress> {
  const { data: existing, error: fetchError } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Address not found.");
  if (existing.used_for_auction_id) {
    throw new Error("This address was used for a won auction and cannot be edited.");
  }

  if (input.is_default) {
    await clearDefaultAddresses(walletAddress, addressId);
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .update({
      nickname: input.nickname.trim(),
      full_name: input.full_name.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      city: input.city.trim(),
      state: input.state?.trim() || null,
      postal_code: input.postal_code.trim(),
      country: input.country,
      phone: input.phone?.trim() || null,
      is_default: input.is_default ?? false,
    })
    .eq("id", addressId)
    .eq("wallet_address", walletAddress)
    .select()
    .single();

  if (error) {
    logSupabaseError("updateShippingAddress", error);
    throw error;
  }

  return parseShippingAddress(data as Record<string, unknown>);
}

export async function deleteShippingAddress(
  walletAddress: string,
  addressId: string
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("shipping_addresses")
    .select("used_for_auction_id")
    .eq("id", addressId)
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Address not found.");
  if (existing.used_for_auction_id) {
    throw new Error("This address was used for a won auction and cannot be deleted.");
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("wallet_address", walletAddress);

  if (error) {
    logSupabaseError("deleteShippingAddress", error);
    throw error;
  }
}
