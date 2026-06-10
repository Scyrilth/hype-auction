"use client";

import { useEffect, useState } from "react";

import { fetchSolUsdRate } from "@/lib/sol-price";

const REFRESH_MS = 60_000;

let cachedPrice: number | null = null;
let isLoading = true;
let fetchPromise: Promise<number | null> | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

async function refreshPrice() {
  if (!fetchPromise) {
    fetchPromise = fetchSolUsdRate().finally(() => {
      fetchPromise = null;
    });
  }

  const price = await fetchPromise;
  cachedPrice = price;
  isLoading = false;
  notifyListeners();
  return price;
}

function ensureRefreshInterval() {
  if (refreshInterval) return;

  refreshInterval = setInterval(() => {
    void refreshPrice();
  }, REFRESH_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureRefreshInterval();

  if (cachedPrice === null && !fetchPromise) {
    void refreshPrice();
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return { solPrice: cachedPrice, loading: isLoading };
}

export function useSolPrice() {
  const [snapshot, setSnapshot] = useState(getSnapshot);

  useEffect(() => subscribe(() => setSnapshot(getSnapshot())), []);

  return snapshot;
}
