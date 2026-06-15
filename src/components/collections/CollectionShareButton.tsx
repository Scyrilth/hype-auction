"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/Toast";

export default function CollectionShareButton({
  collectionName,
}: {
  collectionName: string;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onClick = () => setOpen(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy link.", "error");
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my ${collectionName} collection on Hype Auction 🔥`
  )}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-all duration-150 ease-in-out hover:scale-[1.02] hover:bg-white/10 hover:text-white"
      >
        <i className="ti ti-share text-sm" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
          >
            <i className="ti ti-link text-purple-300" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            <i className="ti ti-brand-x text-purple-300" />
            Share on X (Twitter)
          </a>
        </div>
      )}
    </div>
  );
}
