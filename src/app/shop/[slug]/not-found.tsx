import Link from "next/link";

import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function ShopNotFound() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-2xl font-bold text-white">Shop not found</h1>
          <p className="text-sm text-muted">
            This vendor does not exist or has not set up their shop yet.
          </p>
          <Link
            href="/"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Back to auctions
          </Link>
        </main>
      </div>
    </div>
  );
}
