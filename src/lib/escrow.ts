import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  type TransactionSignature,
  type VersionedTransaction,
} from "@solana/web3.js";

import { createSolanaConnection, isSolanaDevnet } from "@/lib/solana-config";
import { HYPE_ESCROW_IDL } from "@/lib/hype-escrow-idl";
import { fetchSolUsdRate } from "@/lib/sol-price";
import { getErrorMessage } from "@/lib/errors";
import { getAuctionThreadId } from "@/lib/messages";
import {
  logEscrowFunded,
  logEscrowRefunded,
  logEscrowDisputeResolved,
} from "@/lib/escrow-ledger";
import { notifyDisputeResolved } from "@/lib/notifications";
import { postPaymentSecuredNotifications } from "@/lib/payment-notifications-client";
import { supabase } from "@/lib/supabase";

const DEVNET_PROGRAM_ID = "CsBnH378WLH2bUr9FBzCcXUW3dtFMPj4ucdjtqJv8CKs";
const MAINNET_PROGRAM_ID = "DWvYLFF7iYYsZF97mYP7EhkEXXf1FPxs6SieTfgT5dYT";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    (isSolanaDevnet() ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID)
);

export const PLATFORM_WALLET =
  process.env.NEXT_PUBLIC_PLATFORM_WALLET ??
  "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT";

export const PLATFORM_FEE_BPS = 400;

export type EscrowOnChainStatus =
  | "pending"
  | "funded"
  | "shipped"
  | "complete"
  | "disputed"
  | "refunded"
  | "cancelled"
  | "expired"
  | "not_found";

export type EscrowPaymentResult =
  | { success: true; txSignature: string; escrowPda: string }
  | { success: false; error: string };

export type EscrowTxResult =
  | { success: true; txSignature: string }
  | { success: false; error: string };

export type EscrowWallet = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
};

export function createEscrowProvider(
  connection: Connection,
  wallet: EscrowWallet
): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function getEscrowConnection(): Connection {
  return createSolanaConnection();
}

export function auctionIdToBytes(auctionId: string): number[] {
  const hex = auctionId.replace(/-/g, "");
  const buf = Buffer.alloc(32);
  Buffer.from(hex, "hex").copy(buf);
  return Array.from(buf);
}

export function getEscrowPDA(auctionId: string): [PublicKey, number] {
  const auctionIdBytes = Buffer.from(auctionId.replace(/-/g, ""), "hex");
  const padded = Buffer.alloc(32);
  auctionIdBytes.copy(padded);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), padded],
    PROGRAM_ID
  );
}

export function getExplorerTxUrl(signature: string): string {
  const cluster = isSolanaDevnet() ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

export function getExplorerAccountUrl(address: string): string {
  const cluster = isSolanaDevnet() ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

function getProgram(provider: AnchorProvider): Program {
  const idl = {
    ...HYPE_ESCROW_IDL,
    address: PROGRAM_ID.toBase58(),
  } as unknown as Idl;

  try {
    const program = new Program(idl, provider);
    const methods = Object.keys(program.methods ?? {});

    if (!methods.includes("initializeEscrow")) {
      console.error("[escrow] Program loaded without initializeEscrow method", {
        programId: PROGRAM_ID.toBase58(),
        availableMethods: methods,
      });
      throw new Error(
        "Escrow program failed to load instruction methods. Check NEXT_PUBLIC_PROGRAM_ID and IDL."
      );
    }

    return program;
  } catch (error) {
    console.error("[escrow] Failed to initialize Anchor program", {
      programId: PROGRAM_ID.toBase58(),
      error,
    });
    throw error;
  }
}

async function fetchSolUsdFromBinance(): Promise<number> {
  const response = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
  );
  if (!response.ok) {
    throw new Error("Unable to fetch SOL price from Binance.");
  }
  const data = (await response.json()) as { price?: string };
  const price = parseFloat(data.price ?? "");
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid SOL price returned from Binance.");
  }
  return price;
}

export async function usdToSol(usdAmount: number): Promise<number> {
  if (usdAmount <= 0) return 0;
  const solPrice = await fetchSolUsdFromBinance();
  return usdAmount / solPrice;
}

export async function usdToLamports(usdAmount: number): Promise<number> {
  const solAmount = await usdToSol(usdAmount);
  return Math.ceil(solAmount * LAMPORTS_PER_SOL);
}

export interface PaymentBreakdown {
  bidSol: number;
  itemSol: number;
  shippingSol: number;
  shippingUsd: number;
  totalSol: number;
}

export async function calculatePaymentBreakdown(
  bidAmountSol: number,
  shippingUsd: number
): Promise<PaymentBreakdown> {
  const shippingSol = await usdToSol(shippingUsd);
  return {
    bidSol: bidAmountSol,
    itemSol: bidAmountSol,
    shippingSol,
    shippingUsd,
    totalSol: bidAmountSol + shippingSol,
  };
}

export async function checkWalletBalance(
  walletAddress: string,
  requiredSol: number
): Promise<boolean> {
  const connection = getEscrowConnection();
  const balance = await connection.getBalance(new PublicKey(walletAddress));
  const balanceSol = balance / LAMPORTS_PER_SOL;
  return balanceSol >= requiredSol + 0.01;
}

function parseEscrowStateValue(
  state: Record<string, unknown> | undefined
): EscrowOnChainStatus {
  if (!state || typeof state !== "object") return "not_found";
  if ("pending" in state) return "pending";
  if ("funded" in state) return "funded";
  if ("shipped" in state) return "shipped";
  if ("complete" in state) return "complete";
  if ("disputed" in state) return "disputed";
  if ("refunded" in state) return "refunded";
  if ("cancelled" in state) return "cancelled";
  if ("expired" in state) return "expired";
  return "not_found";
}

function formatAnchorError(error: unknown): string {
  if (error instanceof Error && error.message.includes("User rejected")) {
    return "Transaction cancelled in wallet.";
  }

  return getErrorMessage(
    error,
    "Unable to complete escrow transaction. Please try again."
  );
}

export async function getEscrowStatus(
  auctionId: string
): Promise<EscrowOnChainStatus> {
  try {
    const [escrowPda] = getEscrowPDA(auctionId);
    const connection = getEscrowConnection();
    const accountInfo = await connection.getAccountInfo(escrowPda, "confirmed");
    if (!accountInfo) return "not_found";

    const provider = new AnchorProvider(connection, {} as EscrowWallet, {
      commitment: "confirmed",
    });
    const program = getProgram(provider);
    const accountClient = program.account as Record<
      string,
      { fetch: (address: PublicKey) => Promise<{ state: unknown }> }
    >;
    const account = await accountClient.escrowAccount.fetch(escrowPda);
    return parseEscrowStateValue(account.state as Record<string, unknown>);
  } catch {
    return "not_found";
  }
}

export async function verifyPayment(auctionId: string): Promise<boolean> {
  const status = await getEscrowStatus(auctionId);
  return ["funded", "shipped", "complete", "disputed"].includes(status);
}

export async function initiatePayment(
  auctionId: string,
  wallet: EscrowWallet,
  provider: AnchorProvider,
  bidAmountSol: number,
  shippingUsd: number,
  sellerWallet: string,
  platformWallet: string = PLATFORM_WALLET,
  attemptNumber = 1,
  threadId?: string | null
): Promise<EscrowPaymentResult> {
  try {
    const amountLamports = Math.ceil(bidAmountSol * LAMPORTS_PER_SOL);
    const shippingLamports = await usdToLamports(shippingUsd);
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const sellerPk = new PublicKey(sellerWallet);
    const platformPk = new PublicKey(platformWallet);

    const initTx = await program.methods
      .initializeEscrow(
        auctionIdArg,
        sellerPk,
        platformPk,
        new BN(amountLamports),
        new BN(shippingLamports),
        PLATFORM_FEE_BPS,
        attemptNumber
      )
      .accounts({
        buyer: wallet.publicKey,
        seller: sellerPk,
        platformWallet: platformPk,
        escrow: escrowPda,
      })
      .transaction();

    const depositTx = await program.methods
      .deposit(auctionIdArg)
      .accounts({
        buyer: wallet.publicKey,
        escrow: escrowPda,
      })
      .transaction();

    const transaction = new Transaction();
    transaction.add(...initTx.instructions, ...depositTx.instructions);

    const depositSig = (await provider.sendAndConfirm(transaction, [], {
      commitment: "confirmed",
    })) as TransactionSignature;

    const totalLamports = amountLamports + shippingLamports;
    const paymentCompletedAt = new Date().toISOString();
    const solUsdRate = await fetchSolUsdRate();

    const escrowUpdate: Record<string, unknown> = {
      escrow_pda: escrowPda.toBase58(),
      escrow_tx_signature: depositSig,
      escrow_funded: true,
      escrow_state: "funded",
      escrow_funded_at: paymentCompletedAt,
      escrow_amount_lamports: totalLamports,
      escrow_attempt_number: attemptNumber,
      payment_completed_at: paymentCompletedAt,
    };

    if (solUsdRate !== null) {
      escrowUpdate.sol_usd_rate_at_payment = solUsdRate;
    }

    const buyerWallet = wallet.publicKey.toBase58();
    const resolvedThreadId =
      threadId?.trim() ||
      (await getAuctionThreadId(auctionId, buyerWallet));

    const { error } = await supabase
      .from("auctions")
      .update(escrowUpdate)
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase escrow update failed:", error);
    } else {
      try {
        await logEscrowFunded({
          auctionId,
          threadId: resolvedThreadId,
          buyerWallet,
          escrowPda: escrowPda.toBase58(),
          amountLamports: totalLamports,
          bidLamports: amountLamports,
          shippingLamports,
          onChainSignature: depositSig,
        });
      } catch (ledgerError) {
        console.error("Escrow ledger funded insert failed:", ledgerError);
      }
    }

    try {
      await postPaymentSecuredNotifications({
        auctionId,
        buyerWallet,
        threadId: resolvedThreadId,
        totalSol: totalLamports / LAMPORTS_PER_SOL,
      });
    } catch (notifyError) {
      console.error("Payment notification failed:", notifyError);
    }

    return {
      success: true,
      txSignature: depositSig,
      escrowPda: escrowPda.toBase58(),
    };
  } catch (error) {
    console.error("initiatePayment failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
}

export async function confirmReceiptOnChain(
  auctionId: string,
  wallet: EscrowWallet,
  provider: AnchorProvider,
  sellerWallet: string,
  platformWallet: string = PLATFORM_WALLET
): Promise<EscrowTxResult> {
  try {
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const txSignature = (await program.methods
      .release(auctionIdArg)
      .accounts({
        buyer: wallet.publicKey,
        seller: new PublicKey(sellerWallet),
        platformWallet: new PublicKey(platformWallet),
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    return { success: true, txSignature };
  } catch (error) {
    console.error("confirmReceiptOnChain failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
}

export async function resolveDisputeOnChain(
  auctionId: string,
  wallet: EscrowWallet,
  provider: AnchorProvider,
  sellerWallet: string,
  buyerWallet: string,
  releaseToSeller: boolean
): Promise<EscrowTxResult> {
  try {
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const txSignature = (await program.methods
      .resolveDispute(auctionIdArg, releaseToSeller)
      .accounts({
        platformWallet: wallet.publicKey,
        buyer: new PublicKey(buyerWallet),
        seller: new PublicKey(sellerWallet),
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    const nextState = releaseToSeller ? "complete" : "refunded";
    const { error } = await supabase
      .from("auctions")
      .update({ escrow_state: nextState })
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase resolve dispute update failed:", error);
    }

    try {
      const [{ data: auctionRow }, { data: threadRow }] = await Promise.all([
        supabase
          .from("auctions")
          .select("title, escrow_pda, escrow_amount_lamports")
          .eq("id", auctionId)
          .maybeSingle(),
        supabase
          .from("message_threads")
          .select("id")
          .eq("auction_id", auctionId)
          .eq("buyer_wallet", buyerWallet)
          .maybeSingle(),
      ]);

      const escrowPda =
        (auctionRow?.escrow_pda as string | undefined) ??
        getEscrowPDA(auctionId)[0].toBase58();
      const totalLamports = Number(auctionRow?.escrow_amount_lamports ?? 0);

      if (totalLamports > 0) {
        await logEscrowDisputeResolved({
          auctionId,
          threadId: (threadRow?.id as string | undefined) ?? null,
          buyerWallet,
          sellerWallet,
          escrowPda,
          totalLamports,
          onChainSignature: txSignature,
          releaseToSeller,
        });
      }

      if (auctionRow?.title) {
        await notifyDisputeResolved({
          buyerWallet,
          sellerWallet,
          auctionTitle: auctionRow.title as string,
          sellerWins: releaseToSeller,
          threadId: (threadRow?.id as string | undefined) ?? null,
        });
      }
    } catch (notifyError) {
      console.error("Dispute resolution notification failed:", notifyError);
    }

    return { success: true, txSignature };
  } catch (error) {
    console.error("resolveDisputeOnChain failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
}

export async function autoRefundOnChain(
  auctionId: string,
  buyerWallet: string,
  provider: AnchorProvider
): Promise<EscrowTxResult> {
  try {
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const txSignature = (await program.methods
      .autoRefund(auctionIdArg)
      .accounts({
        buyer: new PublicKey(buyerWallet),
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    const { error } = await supabase
      .from("auctions")
      .update({ escrow_state: "refunded" })
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase auto refund update failed:", error);
    }

    try {
      const { data: auctionRow } = await supabase
        .from("auctions")
        .select("escrow_pda, escrow_amount_lamports")
        .eq("id", auctionId)
        .maybeSingle();

      const escrowPda =
        (auctionRow?.escrow_pda as string | undefined) ??
        getEscrowPDA(auctionId)[0].toBase58();
      const totalLamports = Number(auctionRow?.escrow_amount_lamports ?? 0);

      if (totalLamports > 0) {
        const { data: threadRow } = await supabase
          .from("message_threads")
          .select("id")
          .eq("auction_id", auctionId)
          .eq("buyer_wallet", buyerWallet)
          .maybeSingle();

        await logEscrowRefunded({
          auctionId,
          threadId: (threadRow?.id as string | undefined) ?? null,
          buyerWallet,
          escrowPda,
          amountLamports: totalLamports,
          onChainSignature: txSignature,
        });
      }
    } catch (ledgerError) {
      console.error("Escrow ledger refund insert failed:", ledgerError);
    }

    return { success: true, txSignature };
  } catch (error) {
    console.error("autoRefundOnChain failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
}

/** Admin release to seller — updates DB; on-chain only when disputed (resolve_dispute). */
export async function adminReleaseToSeller(
  auctionId: string,
  escrowState: string,
  wallet: EscrowWallet,
  provider: AnchorProvider,
  sellerWallet: string,
  buyerWallet: string
): Promise<EscrowTxResult> {
  if (escrowState === "disputed") {
    return resolveDisputeOnChain(
      auctionId,
      wallet,
      provider,
      sellerWallet,
      buyerWallet,
      true
    );
  }

  const { error } = await supabase
    .from("auctions")
    .update({ escrow_state: "released" })
    .eq("id", auctionId);

  if (error) {
    console.error("adminReleaseEscrow: update failed", error);
    return {
      success: false,
      error: "Unable to process your request. Please try again.",
    };
  }

  return { success: true, txSignature: "admin-db-release" };
}

export async function confirmShippingOnChain(
  auctionId: string,
  wallet: EscrowWallet,
  provider: AnchorProvider
): Promise<EscrowTxResult> {
  try {
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const txSignature = (await program.methods
      .confirmShipping(auctionIdArg)
      .accounts({
        seller: wallet.publicKey,
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    return { success: true, txSignature };
  } catch (error) {
    console.error("confirmShippingOnChain failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
}

export function getEscrowStatusLabel(
  escrowState: string | null | undefined
): string | null {
  switch (escrowState) {
    case "funded":
      return "🔒 SOL in escrow — awaiting shipment";
    case "shipped":
      return "📦 Item shipped — confirm receipt when delivered";
    case "complete":
      return "✅ Transaction complete";
    case "disputed":
      return "⚠️ Dispute in progress";
    case "refunded":
      return "↩️ Refunded";
    default:
      return null;
  }
}
