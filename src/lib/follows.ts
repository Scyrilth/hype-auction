import { logSupabaseError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export async function isFollowing(
  followerWallet: string,
  followingWallet: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_wallet")
    .eq("follower_wallet", followerWallet)
    .eq("following_wallet", followingWallet)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function toggleFollow(
  followerWallet: string,
  followingWallet: string
): Promise<{ isFollowing: boolean; followersCount: number }> {
  if (followerWallet === followingWallet) {
    throw new Error("You cannot follow yourself.");
  }

  await upsertUser(followerWallet);

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "toggle_follow",
    {
      p_follower: followerWallet,
      p_following: followingWallet,
    }
  );

  if (!rpcError) {
    const { data: vendor, error: vendorError } = await supabase
      .from("users")
      .select("followers_count")
      .eq("wallet_address", followingWallet)
      .single();

    if (vendorError) throw vendorError;

    return {
      isFollowing: Boolean(rpcResult),
      followersCount: Number(vendor.followers_count ?? 0),
    };
  }

  logSupabaseError("toggleFollow.rpc", rpcError);

  const alreadyFollowing = await isFollowing(followerWallet, followingWallet);

  if (alreadyFollowing) {
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_wallet", followerWallet)
      .eq("following_wallet", followingWallet);

    if (deleteError) throw deleteError;

    const { data: vendor, error: fetchError } = await supabase
      .from("users")
      .select("followers_count")
      .eq("wallet_address", followingWallet)
      .single();

    if (fetchError) throw fetchError;

    const nextCount = Math.max(Number(vendor.followers_count ?? 0) - 1, 0);

    const { error: updateError } = await supabase
      .from("users")
      .update({ followers_count: nextCount })
      .eq("wallet_address", followingWallet);

    if (updateError) throw updateError;

    return { isFollowing: false, followersCount: nextCount };
  }

  const { error: insertError } = await supabase.from("follows").insert({
    follower_wallet: followerWallet,
    following_wallet: followingWallet,
  });

  if (insertError) throw insertError;

  const { data: vendor, error: fetchError } = await supabase
    .from("users")
    .select("followers_count")
    .eq("wallet_address", followingWallet)
    .single();

  if (fetchError) throw fetchError;

  const nextCount = Number(vendor.followers_count ?? 0) + 1;

  const { error: updateError } = await supabase
    .from("users")
    .update({ followers_count: nextCount })
    .eq("wallet_address", followingWallet);

  if (updateError) throw updateError;

  return { isFollowing: true, followersCount: nextCount };
}
