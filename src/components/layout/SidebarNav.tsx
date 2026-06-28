"use client";

import SidebarNavContent from "@/components/layout/SidebarNavContent";

export default function SidebarNav({ activePath }: { activePath?: string }) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-44 flex-col overflow-y-auto border-r border-border bg-surface px-2 py-3 md:flex lg:px-2.5">
      <SidebarNavContent activePath={activePath} />
    </aside>
  );
}
