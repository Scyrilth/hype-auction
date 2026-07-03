import { Keypair } from "@solana/web3.js";

export function loadPlatformKeypair(): Keypair {
  const encoded = process.env.PLATFORM_KEYPAIR_JSON?.trim();
  if (!encoded) {
    throw new Error("PLATFORM_KEYPAIR_JSON is not configured.");
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const secret = JSON.parse(decoded) as number[];
  if (!Array.isArray(secret) || secret.length === 0) {
    throw new Error("PLATFORM_KEYPAIR_JSON must decode to a keypair byte array.");
  }

  return Keypair.fromSecretKey(Uint8Array.from(secret));
}
