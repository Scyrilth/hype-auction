"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  label = "Back",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex items-center text-sm text-muted transition-colors hover:text-white ${className}`.trim()}
    >
      ← {label}
    </button>
  );
}
