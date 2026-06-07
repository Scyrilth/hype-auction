import { notFound } from "next/navigation";

import ShopFollowCheck from "@/components/shop/ShopFollowCheck";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import { getVendorShopData } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getVendorShopData(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <ShopFollowCheck shop={shop} />
        </main>
      </div>
    </div>
  );
}
