"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ShopView from "@/components/shop/ShopView";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { isFollowing } from "@/lib/follows";
import type { VendorShopData } from "@/lib/vendors";

export default function ShopFollowCheck({ shop }: { shop: VendorShopData }) {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!publicKey) {
        if (!cancelled) {
          setInitialFollowing(false);
          setReady(true);
        }
        return;
      }

      try {
        const following = await isFollowing(
          publicKey.toBase58(),
          shop.vendor.wallet_address,
          client
        );
        if (!cancelled) {
          setInitialFollowing(following);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [client, publicKey, shop.vendor.wallet_address]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted">Loading shop...</p>
      </div>
    );
  }

  return <ShopView shop={shop} initialFollowing={initialFollowing} />;
}
