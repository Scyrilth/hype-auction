"use client";

import dynamic from "next/dynamic";

const TopNav = dynamic(() => import("@/components/layout/TopNav"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-12 border-b border-border bg-surface md:left-44"
      aria-hidden
    />
  ),
});

export default function TopNavLoader() {
  return <TopNav />;
}
