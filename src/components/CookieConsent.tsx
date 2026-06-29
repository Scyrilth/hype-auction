"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import {
  COOKIE_CONSENT_CHANGED_EVENT,
  getCookieConsent,
  hasAnalyticsConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";

export function ConsentAwareVercelAnalytics() {
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    const sync = () => setAllowAnalytics(hasAnalyticsConsent());
    sync();

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
  }, []);

  if (!allowAnalytics) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (getCookieConsent()) return;

    setShowBanner(true);
    const frame = requestAnimationFrame(() => setSlideIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback((consent: "all" | "essential") => {
    saveCookieConsent(consent);
    setSlideIn(false);
    window.setTimeout(() => setShowBanner(false), 300);
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[200] p-3 transition-transform duration-300 ease-out sm:p-4 ${
        slideIn ? "translate-y-0" : "translate-y-full"
      }`}
      role="region"
      aria-label="Cookie consent"
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">We use cookies</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            We use essential cookies to keep you logged in and analytics cookies
            to improve your experience. By continuing, you agree to our{" "}
            <Link
              href="/privacy"
              className="font-medium text-purple-300 underline-offset-2 hover:text-accent hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => dismiss("essential")}
            className="w-full rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent/50 hover:bg-surface-elevated sm:w-auto"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => dismiss("all")}
            className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:w-auto"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
