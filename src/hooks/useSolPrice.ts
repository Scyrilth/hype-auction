"use client";

import { useEffect, useState } from "react";

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

async function fetchFromBinance(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { price?: string };
    const price = parseFloat(data.price ?? "");
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { solana?: { usd?: number } };
    const price = data.solana?.usd;
    return typeof price === "number" && Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

async function fetchSolPrice(): Promise<number | null> {
  const binancePrice = await fetchFromBinance();
  if (binancePrice !== null) return binancePrice;
  return fetchFromCoinGecko();
}

async function refreshPrice() {
  if (!fetchPromise) {
    fetchPromise = fetchSolPrice().finally(() => {
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
