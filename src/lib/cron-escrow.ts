import { AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, Transaction, type VersionedTransaction } from "@solana/web3.js";

import {
  createEscrowProvider,
  getEscrowConnection,
  type EscrowWallet,
} from "@/lib/escrow";
import { loadPlatformKeypair } from "@/lib/platform-keypair";

function signWithKeypair(
  transaction: Transaction | VersionedTransaction,
  keypair: Keypair
): Transaction | VersionedTransaction {
  if (transaction instanceof Transaction) {
    transaction.partialSign(keypair);
    return transaction;
  }

  transaction.sign([keypair]);
  return transaction;
}

export function createPlatformEscrowProvider(): AnchorProvider {
  const keypair = loadPlatformKeypair();
  const wallet: EscrowWallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T) =>
      signWithKeypair(transaction, keypair) as T,
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      transactions: T[]
    ) => transactions.map((transaction) => signWithKeypair(transaction, keypair) as T),
  };

  return createEscrowProvider(getEscrowConnection(), wallet);
}

export function getPlatformKeypairPublicKey(): Keypair["publicKey"] {
  return loadPlatformKeypair().publicKey;
}
