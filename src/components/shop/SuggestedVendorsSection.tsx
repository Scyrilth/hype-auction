import VendorCard from "@/components/vendors/VendorCard";
import type { VendorDirectoryEntry } from "@/lib/vendors";

export default function SuggestedVendorsSection({
  vendors,
}: {
  vendors: VendorDirectoryEntry[];
}) {
  if (!vendors.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">
        You might also like
      </h2>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
        {vendors.map((entry) => (
          <div
            key={entry.vendor.wallet_address}
            className="w-[17.5rem] shrink-0 snap-start sm:w-[20rem]"
          >
            <VendorCard entry={entry} />
          </div>
        ))}
      </div>
    </section>
  );
}
