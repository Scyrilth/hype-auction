"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/Toast";

export default function TrackingCopyButton({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast("Tracking number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy tracking number.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-accent/50 hover:text-white ${className}`.trim()}
      title="Copy tracking number"
    >
      <i className="ti ti-copy text-[13px] leading-none" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
