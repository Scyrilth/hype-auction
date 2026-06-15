"use client";

export default function SellerProfileSetupBanner({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
      Complete your seller profile — add your country and shipping settings to
      start listing items
    </div>
  );
}
