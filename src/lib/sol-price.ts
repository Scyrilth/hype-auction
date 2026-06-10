/** Shared SOL/USD price fetch (Binance primary, CoinGecko fallback). */

async function fetchFromBinance(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { price?: string };
    const price = parseFloat(data.price ?? "");
    return Number.isFinite(price) && price > 0 ? price : null;
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
    return typeof price === "number" && Number.isFinite(price) && price > 0
      ? price
      : null;
  } catch {
    return null;
  }
}

/** Fetch current SOL/USD rate. Prefers Binance. */
export async function fetchSolUsdRate(): Promise<number | null> {
  const binancePrice = await fetchFromBinance();
  if (binancePrice !== null) return binancePrice;
  return fetchFromCoinGecko();
}
