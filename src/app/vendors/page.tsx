import VendorDirectory from "@/components/vendors/VendorDirectory";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { getVendorDirectory } from "@/lib/vendors";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendorDirectory();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/vendors" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <VendorDirectory vendors={vendors} />
        </main>
      </div>
    </div>
  );
}
