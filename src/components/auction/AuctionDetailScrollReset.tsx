"use client";

import { useEffect } from "react";

export default function AuctionDetailScrollReset({
  auctionId,
}: {
  auctionId: string;
}) {
  useEffect(() => {
    window.scrollTo(0, 0);

    const main = document.querySelector("main.flex-1.overflow-y-auto");
    if (main instanceof HTMLElement) {
      main.scrollTop = 0;
    }
  }, [auctionId]);

  return null;
}
