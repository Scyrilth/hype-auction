import { notFound } from "next/navigation";

import ShopFollowCheck from "@/components/shop/ShopFollowCheck";
import AppShell from "@/components/layout/AppShell";
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
    <AppShell contentClassName="flex-1 overflow-y-auto p-4 sm:p-5">
      <BackButton className="mb-4" />
      <ShopFollowCheck shop={shop} />
    </AppShell>
  );
}
