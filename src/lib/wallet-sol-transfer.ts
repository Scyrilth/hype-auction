import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import type { EscrowWallet } from "@/lib/escrow";
import { getErrorMessage, TX_FAILED_OR_CANCELLED_MESSAGE } from "@/lib/errors";

export type WalletSolTransferResult =
  | { success: true; txSignature: string }
  | { success: false; error: string };

export async function sendWalletSolTransfer({
  connection,
  wallet,
  recipientWallet,
  lamports,
}: {
  connection: Connection;
  wallet: EscrowWallet;
  recipientWallet: string;
  lamports: number;
}): Promise<WalletSolTransferResult> {
  if (!Number.isFinite(lamports) || lamports < 1) {
    return { success: false, error: "Refund amount is too small to send." };
  }

  let fromPubkey: PublicKey;
  let toPubkey: PublicKey;

  try {
    fromPubkey = wallet.publicKey;
    toPubkey = new PublicKey(recipientWallet);
  } catch {
    return { success: false, error: "Invalid wallet address." };
  }

  if (fromPubkey.equals(toPubkey)) {
    return { success: false, error: "Cannot send a refund to your own wallet." };
  }

  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(lamports),
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signed = await wallet.signTransaction(transaction);
    const txSignature = await connection.sendRawTransaction(
      signed.serialize(),
      { skipPreflight: false }
    );

    await connection.confirmTransaction(
      {
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    return { success: true, txSignature };
  } catch (error) {
    console.error("sendWalletSolTransfer failed:", error);
    return {
      success: false,
      error: getErrorMessage(error, TX_FAILED_OR_CANCELLED_MESSAGE),
    };
  }
}
