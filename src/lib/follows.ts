import { logSupabaseError } from "@/lib/errors";
import { notifyNewFollower } from "@/lib/notifications";
import { supabase, type SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export async function isFollowing(
  followerWallet: string,
  followingWallet: string,
  client: SupabaseClient = supabase
): Promise<boolean> {
  const { data, error } = await client
    .from("follows")
    .select("follower_wallet")
    .eq("follower_wallet", followerWallet)
    .eq("vendor_wallet", followingWallet)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function toggleFollow(
  followerWallet: string,
  followingWallet: string,
  client: SupabaseClient = supabase
): Promise<{ isFollowing: boolean; followersCount: number }> {
  if (followerWallet === followingWallet) {
    throw new Error("You cannot follow yourself.");
  }

  try {
    await upsertUser(followerWallet, client);
  } catch (upsertError) {
    console.error("[toggleFollow] upsertUser failed", upsertError);
    throw upsertError;
  }

  const { data: rpcResult, error: rpcError } = await client.rpc(
    "toggle_follow",
    {
      p_follower: followerWallet,
      p_following: followingWallet,
    }
  );

  if (rpcError) {
    console.error("[toggleFollow] RPC error", {
      message: rpcError.message,
      code: rpcError.code,
      details: rpcError.details,
      hint: rpcError.hint,
    });
  }

  if (!rpcError) {
    const { data: vendor, error: vendorError } = await client
      .from("users")
      .select("followers_count")
      .eq("wallet_address", followingWallet)
      .single();

    if (vendorError) {
      console.error("[toggleFollow] followers_count select failed", vendorError);
      throw vendorError;
    }

    const isFollowingNow = Boolean(rpcResult);
    if (isFollowingNow) {
      await notifyNewFollower({
        followingWallet,
        followerWallet,
      });
    }

    return {
      isFollowing: isFollowingNow,
      followersCount: Number(vendor.followers_count ?? 0),
    };
  }

  logSupabaseError("toggleFollow.rpc", rpcError);

  const alreadyFollowing = await isFollowing(
    followerWallet,
    followingWallet,
    client
  );

  if (alreadyFollowing) {
    const { error: deleteError } = await client
      .from("follows")
      .delete()
      .eq("follower_wallet", followerWallet)
      .eq("vendor_wallet", followingWallet);

    if (deleteError) throw deleteError;

    const { data: vendor, error: fetchError } = await client
      .from("users")
      .select("followers_count")
      .eq("wallet_address", followingWallet)
      .single();

    if (fetchError) throw fetchError;

    const nextCount = Math.max(Number(vendor.followers_count ?? 0) - 1, 0);

    const { error: updateError } = await client
      .from("users")
      .update({ followers_count: nextCount })
      .eq("wallet_address", followingWallet);

    if (updateError) throw updateError;

    return { isFollowing: false, followersCount: nextCount };
  }

  const { error: insertError } = await client.from("follows").insert({
    follower_wallet: followerWallet,
    vendor_wallet: followingWallet,
  });

  if (insertError) throw insertError;

  const { data: vendor, error: fetchError } = await client
    .from("users")
    .select("followers_count")
    .eq("wallet_address", followingWallet)
    .single();

  if (fetchError) throw fetchError;

  const nextCount = Number(vendor.followers_count ?? 0) + 1;

  const { error: updateError } = await client
    .from("users")
    .update({ followers_count: nextCount })
    .eq("wallet_address", followingWallet);

  if (updateError) throw updateError;

  await notifyNewFollower({
    followingWallet,
    followerWallet,
  });

  return { isFollowing: true, followersCount: nextCount };
}
