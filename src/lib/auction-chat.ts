import { shortenAddress } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export interface ChatMessage {
  id: string;
  auction_id: string;
  wallet_address: string;
  username: string;
  profile_username: string | null;
  content: string;
  created_at: string;
}

export function walletUsername(walletAddress: string) {
  return shortenAddress(walletAddress, 4);
}

export async function enrichChatMessage(
  row: Record<string, unknown>,
  client: SupabaseClient = supabase
): Promise<ChatMessage> {
  const walletAddress = row.wallet_address as string;

  const { data: user } = await client
    .from("users")
    .select("username")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  return {
    id: row.id as string,
    auction_id: row.auction_id as string,
    wallet_address: walletAddress,
    username: row.username as string,
    profile_username: (user?.username as string | null) ?? null,
    content: row.content as string,
    created_at: row.created_at as string,
  };
}

export async function fetchAuctionMessages(
  auctionId: string,
  client: SupabaseClient = supabase
): Promise<ChatMessage[]> {
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("auction_id", auctionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const wallets = [
    ...new Set(data.map((row) => row.wallet_address as string)),
  ];

  const { data: users, error: usersError } = await client
    .from("users")
    .select("wallet_address, username")
    .in("wallet_address", wallets);

  if (usersError) throw usersError;

  const usernameByWallet = new Map(
    (users ?? []).map((row) => [
      row.wallet_address as string,
      (row.username as string | null) ?? null,
    ])
  );

  return data.map((row) => ({
    id: row.id as string,
    auction_id: row.auction_id as string,
    wallet_address: row.wallet_address as string,
    username: row.username as string,
    profile_username: usernameByWallet.get(row.wallet_address as string) ?? null,
    content: row.content as string,
    created_at: row.created_at as string,
  }));
}

export async function sendAuctionMessage({
  auctionId,
  walletAddress,
  content,
}: {
  auctionId: string;
  walletAddress: string;
  content: string;
}, client: SupabaseClient = supabase) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  await upsertUser(walletAddress);

  const { data, error } = await client
    .from("messages")
    .insert({
      auction_id: auctionId,
      wallet_address: walletAddress,
      username: walletUsername(walletAddress),
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;

  const { data: user } = await client
    .from("users")
    .select("username")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  return {
    id: data.id as string,
    auction_id: data.auction_id as string,
    wallet_address: data.wallet_address as string,
    username: data.username as string,
    profile_username: (user?.username as string | null) ?? null,
    content: data.content as string,
    created_at: data.created_at as string,
  };
}
