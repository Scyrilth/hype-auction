"use client";

import dynamic from "next/dynamic";

const MobilePhantomTip = dynamic(
  () => import("@/components/wallet/MobilePhantomTip"),
  { ssr: false }
);

export default function MobilePhantomTipLoader() {
  return <MobilePhantomTip />;
}
