/**
 * One-off: mint a wallet session JWT the same way as issueWalletSessionToken().
 *
 * Usage:
 *   node scripts/issue-wallet-session-token.mjs [walletAddress]
 *
 * Reads WALLET_AUTH_SECRET from .env.local (or process env).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SignJWT } from "jose";
import { PublicKey } from "@solana/web3.js";

const DEFAULT_WALLET = "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT";
const SESSION_TTL = "24h";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // rely on existing process.env
  }
}

loadEnvLocal();

const wallet = (process.argv[2] ?? DEFAULT_WALLET).trim();
try {
  new PublicKey(wallet);
} catch {
  console.error(`Invalid wallet address: ${wallet}`);
  process.exit(1);
}

const secret = process.env.WALLET_AUTH_SECRET?.trim();
if (!secret || secret.length < 32) {
  console.error("WALLET_AUTH_SECRET is missing or shorter than 32 chars.");
  process.exit(1);
}

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + 24 * 60 * 60;
const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(wallet)
  .setIssuedAt(issuedAt)
  .setExpirationTime(SESSION_TTL)
  .sign(new TextEncoder().encode(secret));

console.log(token);
console.error(`wallet=${wallet}`);
console.error(`expiresAt=${new Date(expiresAt * 1000).toISOString()}`);
