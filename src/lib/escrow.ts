import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  type Transaction,
  type TransactionSignature,
  type VersionedTransaction,
} from "@solana/web3.js";

import { supabase } from "@/lib/supabase";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "CsBnH378WLH2bUr9FBzCcXUW3dtFMPj4ucdjtqJv8CKs"
);
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
const RPC_URL =
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

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

const IDL = {
  address: "CsBnH378WLH2bUr9FBzCcXUW3dtFMPj4ucdjtqJv8CKs",
  metadata: {
    name: "hype_escrow",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "initialize_escrow",
      discriminator: [243, 160, 77, 153, 11, 92, 48, 209],
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "seller" },
        { name: "platform_wallet" },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "auction_id", type: { array: ["u8", 32] } },
        { name: "seller", type: "pubkey" },
        { name: "platform_wallet", type: "pubkey" },
        { name: "amount_lamports", type: "u64" },
        { name: "shipping_lamports", type: "u64" },
        { name: "platform_fee_bps", type: "u16" },
        { name: "attempt_number", type: "u8" },
      ],
    },
    {
      name: "deposit",
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182],
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "expire_escrow",
      discriminator: [49, 150, 54, 201, 45, 106, 39, 175],
      accounts: [{ name: "escrow", writable: true }],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "buy_now",
      discriminator: [242, 42, 184, 77, 133, 152, 118, 204],
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "seller" },
        { name: "platform_wallet" },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "auction_id", type: { array: ["u8", 32] } },
        { name: "seller", type: "pubkey" },
        { name: "platform_wallet", type: "pubkey" },
        { name: "amount_lamports", type: "u64" },
        { name: "shipping_lamports", type: "u64" },
        { name: "platform_fee_bps", type: "u16" },
      ],
    },
    {
      name: "confirm_shipping",
      discriminator: [201, 210, 238, 231, 90, 157, 77, 124],
      accounts: [
        { name: "seller", signer: true },
        { name: "escrow", writable: true },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "release",
      discriminator: [253, 249, 15, 206, 28, 127, 193, 241],
      accounts: [
        { name: "buyer", signer: true },
        { name: "seller", writable: true },
        { name: "platform_wallet", writable: true },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "open_dispute",
      discriminator: [137, 25, 99, 119, 23, 223, 161, 42],
      accounts: [
        { name: "buyer", signer: true },
        { name: "escrow", writable: true },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "resolve_dispute",
      discriminator: [231, 6, 202, 6, 96, 103, 12, 230],
      accounts: [
        { name: "platform_wallet", writable: true, signer: true },
        { name: "buyer", writable: true },
        { name: "seller", writable: true },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "auction_id", type: { array: ["u8", 32] } },
        { name: "release_to_seller", type: "bool" },
      ],
    },
    {
      name: "auto_refund",
      discriminator: [64, 219, 182, 3, 234, 13, 10, 209],
      accounts: [
        { name: "buyer", writable: true },
        { name: "escrow", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
    {
      name: "cancel",
      discriminator: [232, 219, 223, 41, 219, 236, 220, 190],
      accounts: [
        { name: "platform_wallet", signer: true },
        { name: "buyer", writable: true },
        { name: "escrow", writable: true },
      ],
      args: [{ name: "auction_id", type: { array: ["u8", 32] } }],
    },
  ],
  accounts: [
    {
      name: "EscrowAccount",
      discriminator: [36, 69, 48, 18, 128, 225, 125, 135],
    },
  ],
  types: [
    {
      name: "EscrowAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "auction_id", type: { array: ["u8", 32] } },
          { name: "buyer", type: "pubkey" },
          { name: "seller", type: "pubkey" },
          { name: "platform_wallet", type: "pubkey" },
          { name: "amount_lamports", type: "u64" },
          { name: "shipping_lamports", type: "u64" },
          { name: "platform_fee_bps", type: "u16" },
          { name: "state", type: { defined: { name: "EscrowState" } } },
          { name: "attempt_number", type: "u8" },
          { name: "payment_deadline", type: "i64" },
          { name: "funded_at", type: "i64" },
          { name: "shipped_at", type: "i64" },
          { name: "dispute_opened_at", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "EscrowState",
      type: {
        kind: "enum",
        variants: [
          { name: "Pending" },
          { name: "Funded" },
          { name: "Shipped" },
          { name: "Complete" },
          { name: "Disputed" },
          { name: "Refunded" },
          { name: "Cancelled" },
          { name: "Expired" },
        ],
      },
    },
  ],
} as const satisfies Idl;

type HypeEscrowProgram = Program<typeof IDL>;

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
  return new Connection(RPC_URL, "confirmed");
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
  const cluster = NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

export function getExplorerAccountUrl(address: string): string {
  const cluster = NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

function getProgram(provider: AnchorProvider): HypeEscrowProgram {
  return new Program(IDL, provider);
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

export async function usdToLamports(usdAmount: number): Promise<number> {
  if (usdAmount <= 0) return 0;
  const solPrice = await fetchSolUsdFromBinance();
  const solAmount = usdAmount / solPrice;
  return Math.ceil(solAmount * LAMPORTS_PER_SOL);
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
  if (error instanceof Error) {
    if (error.message.includes("User rejected")) {
      return "Transaction cancelled in wallet.";
    }
    return error.message;
  }
  return "An unexpected escrow error occurred.";
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
    const account = await program.account.EscrowAccount.fetch(escrowPda);
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
  attemptNumber = 1
): Promise<EscrowPaymentResult> {
  try {
    const amountLamports = Math.ceil(bidAmountSol * LAMPORTS_PER_SOL);
    const shippingLamports = await usdToLamports(shippingUsd);
    const auctionIdArg = auctionIdToBytes(auctionId);
    const [escrowPda] = getEscrowPDA(auctionId);
    const program = getProgram(provider);

    const sellerPk = new PublicKey(sellerWallet);
    const platformPk = new PublicKey(platformWallet);

    await program.methods
      .initialize_escrow(
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
        platform_wallet: platformPk,
        escrow: escrowPda,
      })
      .rpc();

    const depositSig = (await program.methods
      .deposit(auctionIdArg)
      .accounts({
        buyer: wallet.publicKey,
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    const totalLamports = amountLamports + shippingLamports;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("auctions")
      .update({
        escrow_pda: escrowPda.toBase58(),
        escrow_tx_signature: depositSig,
        escrow_funded: true,
        escrow_state: "funded",
        escrow_funded_at: now,
        escrow_amount_lamports: totalLamports,
        escrow_attempt_number: attemptNumber,
      })
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase escrow update failed:", error);
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
        platform_wallet: new PublicKey(platformWallet),
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    const { error } = await supabase
      .from("auctions")
      .update({ escrow_state: "complete" })
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase escrow complete update failed:", error);
    }

    return { success: true, txSignature };
  } catch (error) {
    console.error("confirmReceiptOnChain failed:", error);
    return { success: false, error: formatAnchorError(error) };
  }
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
      .confirm_shipping(auctionIdArg)
      .accounts({
        seller: wallet.publicKey,
        escrow: escrowPda,
      })
      .rpc()) as TransactionSignature;

    const { error } = await supabase
      .from("auctions")
      .update({ escrow_state: "shipped" })
      .eq("id", auctionId);

    if (error) {
      console.error("Supabase escrow shipped update failed:", error);
    }

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
