"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { connected, connecting } = useWallet();

  useEffect(() => {
    if (!connecting && !connected) {
      router.replace("/");
    }
  }, [connected, connecting, router]);

  if (connecting) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted">Checking wallet connection...</p>
      </div>
    );
  }

  if (!connected) {
    return null;
  }

  return <>{children}</>;
}
