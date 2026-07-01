import VendorDirectory from "@/components/vendors/VendorDirectory";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { buildPageMetadata } from "@/lib/seo";
import { getVendorDirectory } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Vendors — Hype Auction",
  description:
    "Browse verified sellers, live streamers, and top-rated shops on Hype Auction.",
  path: "/vendors",
});

export default async function VendorsPage() {
  const vendors = await getVendorDirectory();

  return (
    <AppShell
      activePath="/vendors"
      contentClassName="flex-1 overflow-y-auto p-3 sm:p-4"
    >
      <BackButton className="mb-4" />
      <VendorDirectory vendors={vendors} />
    </AppShell>
  );
}
