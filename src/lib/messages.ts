import { shortenAddress } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export interface ChatMessage {
  id: string;
  auction_id: string;
  wallet_address: string;
  username: string;
  content: string;
  created_at: string;
}

export function walletUsername(walletAddress: string) {
  return shortenAddress(walletAddress, 4);
}

export async function fetchAuctionMessages(
  auctionId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("auction_id", auctionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendAuctionMessage({
  auctionId,
  walletAddress,
  content,
}: {
  auctionId: string;
  walletAddress: string;
  content: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  await upsertUser(walletAddress);

  const { data, error } = await supabase
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
  return data as ChatMessage;
}
