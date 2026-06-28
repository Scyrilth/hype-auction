"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";

const STORAGE_KEY = "ha_mobile_tip_shown";
const AUTO_DISMISS_MS = 8000;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  if (window.innerWidth >= 768) return false;

  const userAgent = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    ) || window.innerWidth < 768
  );
}

export default function MobilePhantomTip() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (connected) {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      return;
    }

    if (!isMobileViewport()) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    const showTimer = window.setTimeout(() => setVisible(true), 400);
    return () => window.clearTimeout(showTimer);
  }, [connected, mounted]);

  useEffect(() => {
    if (!visible) return;

    const autoDismissTimer = window.setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(autoDismissTimer);
  }, [dismiss, visible]);

  const handleOpenPhantom = useCallback(() => {
    dismiss();
    window.open("https://phantom.app", "_blank", "noopener,noreferrer");
  }, [dismiss]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] p-4 md:hidden">
      <div
        className="mobile-phantom-tip pointer-events-auto mx-auto max-w-md rounded-2xl border border-purple-800/60 bg-[#1a1835] p-4 shadow-2xl"
        role="dialog"
        aria-labelledby="mobile-phantom-tip-title"
        aria-describedby="mobile-phantom-tip-desc"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2
              id="mobile-phantom-tip-title"
              className="text-sm font-semibold text-white"
            >
              Using Hype Auction on mobile?
            </h2>
            <p
              id="mobile-phantom-tip-desc"
              className="mt-1.5 text-xs leading-relaxed text-zinc-300"
            >
              For the best experience, open this site inside the Phantom app
              browser. Download Phantom at phantom.app
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <i className="ti ti-x text-base leading-none" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenPhantom}
          className="mt-3 w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Open Phantom
        </button>
      </div>
    </div>,
    document.body
  );
}
