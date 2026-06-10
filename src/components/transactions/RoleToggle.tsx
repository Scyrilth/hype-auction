"use client";

import type { TransactionRole } from "@/lib/transactions";

export default function RoleToggle({
  role,
  onChange,
}: {
  role: TransactionRole;
  onChange: (role: TransactionRole) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface-elevated p-1">
      <button
        type="button"
        onClick={() => onChange("selling")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          role === "selling"
            ? "bg-accent text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
            : "text-muted hover:text-white"
        }`}
      >
        Selling
      </button>
      <button
        type="button"
        onClick={() => onChange("buying")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          role === "buying"
            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]"
            : "text-muted hover:text-white"
        }`}
      >
        Buying
      </button>
    </div>
  );
}
