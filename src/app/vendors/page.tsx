import VendorDirectory from "@/components/vendors/VendorDirectory";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { getVendorDirectory } from "@/lib/vendors";

export const dynamic = "force-dynamic";

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
