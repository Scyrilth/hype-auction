import { SignJWT, jwtVerify } from "jose";

import { getSiteUrl } from "@/lib/seo";
import {
  decodeWalletSignature,
  isValidWalletAddress,
  verifyWalletSignature,
} from "@/lib/verify-wallet-signature";
import { getNotificationClient } from "@/lib/supabase";

export const WALLET_AUTH_MESSAGE_VERSION = "1";
export const WALLET_AUTH_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const WALLET_AUTH_SESSION_TTL = "24h";
export const WALLET_AUTH_CLOCK_SKEW_MS = 60 * 1000;

export type WalletSession = {
  wallet: string;
};

export type WalletSessionResult =
  | { ok: true; session: WalletSession }
  | { ok: false; status: 401 | 403; error: string };

export type ParsedSignInMessage = {
  walletAddress: string;
  uri: string;
  version: string;
  nonce: string;
  issuedAt: string;
};

function getWalletAuthSecret(): Uint8Array {
  const secret = process.env.WALLET_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("WALLET_AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export function buildSignInMessage({
  walletAddress,
  nonce,
  issuedAt,
  uri = getSiteUrl(),
}: {
  walletAddress: string;
  nonce: string;
  issuedAt: string;
  uri?: string;
}): string {
  return [
    "Hype Auction wants you to sign in with your Solana account:",
    walletAddress,
    "",
    `URI: ${uri}`,
    `Version: ${WALLET_AUTH_MESSAGE_VERSION}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export function parseSignInMessage(message: string): ParsedSignInMessage | null {
  const lines = message.replace(/\r\n/g, "\n").split("\n");
  if (lines.length < 7) return null;

  const header = lines[0]?.trim();
  const walletAddress = lines[1]?.trim();
  const uriLine = lines[3]?.trim();
  const versionLine = lines[4]?.trim();
  const nonceLine = lines[5]?.trim();
  const issuedAtLine = lines[6]?.trim();

  if (
    header !==
      "Hype Auction wants you to sign in with your Solana account:" ||
    !walletAddress ||
    !uriLine?.startsWith("URI: ") ||
    !versionLine?.startsWith("Version: ") ||
    !nonceLine?.startsWith("Nonce: ") ||
    !issuedAtLine?.startsWith("Issued At: ")
  ) {
    return null;
  }

  return {
    walletAddress,
    uri: uriLine.slice("URI: ".length).trim(),
    version: versionLine.slice("Version: ".length).trim(),
    nonce: nonceLine.slice("Nonce: ".length).trim(),
    issuedAt: issuedAtLine.slice("Issued At: ".length).trim(),
  };
}

function isIssuedAtFresh(issuedAt: string, now = Date.now()): boolean {
  const issuedAtMs = Date.parse(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;

  if (issuedAtMs > now + WALLET_AUTH_CLOCK_SKEW_MS) {
    return false;
  }

  return now - issuedAtMs <= WALLET_AUTH_CHALLENGE_TTL_MS;
}

export async function createWalletAuthChallenge(
  walletAddress: string
): Promise<{ message: string; nonce: string; expiresAt: string }> {
  if (!isValidWalletAddress(walletAddress)) {
    throw new Error("Invalid wallet address.");
  }

  const nonce = crypto.randomUUID();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + WALLET_AUTH_CHALLENGE_TTL_MS).toISOString();
  const message = buildSignInMessage({
    walletAddress,
    nonce,
    issuedAt,
  });

  const client = getNotificationClient();
  const { error } = await client.from("wallet_auth_challenges").insert({
    nonce,
    wallet_address: walletAddress,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error("Unable to create sign-in challenge.");
  }

  return { message, nonce, expiresAt };
}

export async function verifyWalletSignIn({
  walletAddress,
  message,
  signature,
}: {
  walletAddress: string;
  message: string;
  signature: string;
}): Promise<WalletSession> {
  if (!isValidWalletAddress(walletAddress)) {
    throw new Error("Invalid wallet address.");
  }

  const parsed = parseSignInMessage(message);
  if (!parsed) {
    throw new Error("Invalid sign-in message.");
  }

  if (parsed.walletAddress !== walletAddress) {
    throw new Error("Wallet mismatch.");
  }

  if (parsed.version !== WALLET_AUTH_MESSAGE_VERSION) {
    throw new Error("Unsupported sign-in message version.");
  }

  if (parsed.uri !== getSiteUrl()) {
    throw new Error("Invalid sign-in domain.");
  }

  if (!isIssuedAtFresh(parsed.issuedAt)) {
    throw new Error("Sign-in message has expired.");
  }

  const signatureBytes = decodeWalletSignature(signature);
  if (!signatureBytes) {
    throw new Error("Invalid signature.");
  }

  const signatureValid = verifyWalletSignature({
    walletAddress,
    message,
    signature: signatureBytes,
  });

  if (!signatureValid) {
    throw new Error("Signature verification failed.");
  }

  const client = getNotificationClient();
  const nowIso = new Date().toISOString();
  const { data: consumedChallenge, error: consumeError } = await client
    .from("wallet_auth_challenges")
    .update({ used_at: nowIso })
    .eq("nonce", parsed.nonce)
    .eq("wallet_address", walletAddress)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .select("id")
    .maybeSingle();

  if (consumeError || !consumedChallenge) {
    throw new Error("Sign-in challenge is invalid or expired.");
  }

  return { wallet: walletAddress };
}

export async function issueWalletSessionToken(
  walletAddress: string
): Promise<{ token: string; expiresAt: number }> {
  const secret = getWalletAuthSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 24 * 60 * 60;

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(walletAddress)
    .setIssuedAt(issuedAt)
    .setExpirationTime(WALLET_AUTH_SESSION_TTL)
    .sign(secret);

  return { token, expiresAt: expiresAt * 1000 };
}

export async function verifyWalletSessionToken(
  token: string
): Promise<WalletSession | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  try {
    const secret = getWalletAuthSecret();
    const { payload } = await jwtVerify(trimmed, secret, {
      algorithms: ["HS256"],
    });

    const wallet = payload.sub?.trim();
    if (!wallet || !isValidWalletAddress(wallet)) {
      return null;
    }

    return { wallet };
  } catch {
    return null;
  }
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim();
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function requireWalletSession(
  request: Request
): Promise<WalletSessionResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required.",
    };
  }

  const session = await verifyWalletSessionToken(token);
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired session.",
    };
  }

  return { ok: true, session };
}

export function assertWalletMatchesSession({
  session,
  claimedWallet,
}: {
  session: WalletSession;
  claimedWallet: string;
}): WalletSessionResult {
  const normalizedClaimed = claimedWallet.trim();
  if (!normalizedClaimed) {
    return {
      ok: false,
      status: 401,
      error: "Wallet address is required.",
    };
  }

  if (session.wallet !== normalizedClaimed) {
    return {
      ok: false,
      status: 403,
      error: "Wallet mismatch.",
    };
  }

  return { ok: true, session };
}
