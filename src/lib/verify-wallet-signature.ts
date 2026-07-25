import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export function verifyWalletSignature({
  walletAddress,
  message,
  signature,
}: {
  walletAddress: string;
  message: string;
  signature: Uint8Array;
}): boolean {
  if (!walletAddress.trim() || !message || signature.length === 0) {
    return false;
  }

  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(
      messageBytes,
      signature,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

export function decodeWalletSignature(signature: string): Uint8Array | null {
  const trimmed = signature.trim();
  if (!trimmed) return null;

  try {
    const bytes = Buffer.from(trimmed, "base64");
    if (bytes.length !== nacl.sign.signatureLength) {
      return null;
    }
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
}

export function isValidWalletAddress(walletAddress: string): boolean {
  try {
    new PublicKey(walletAddress);
    return true;
  } catch {
    return false;
  }
}
