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

      <div className="-mx-1 w-full min-w-0 max-w-full overflow-x-hidden px-1 pb-2">
        <div className="horizontal-scroll-row flex gap-3 overflow-x-auto">
          {vendors.map((entry) => (
            <div
              key={entry.vendor.wallet_address}
              className="horizontal-scroll-item w-[17.5rem] min-w-0 shrink-0 sm:w-[20rem]"
            >
              <div className="w-full">
                <VendorCard entry={entry} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
