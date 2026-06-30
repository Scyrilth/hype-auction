/**
 * One-time mainnet escrow recovery script.
 *
 * IMPORTANT — Release() signer requirements (programs/hype-escrow/src/lib.rs):
 *   pub struct Release<'info> {
 *     pub buyer: Signer<'info>,           // BUYER must sign — admin/deployer cannot substitute
 *     pub seller: UncheckedAccount,       // mut, must match escrow.seller
 *     pub platform_wallet: UncheckedAccount, // mut, must match escrow.platform_wallet
 *     pub escrow: Account<EscrowAccount>, // mut PDA
 *     pub system_program: Program<System>,
 *   }
 *
 * release() also requires escrow.state == Shipped.
 *
 * Admin/platform recovery WITHOUT buyer signature:
 *   1. confirm_shipping — seller signs (state Funded -> Shipped)
 *   2. open_dispute — buyer signs (Shipped -> Disputed)
 *   3. resolve_dispute(release_to_seller=true) — platform_wallet signs (Disputed -> Complete)
 *
 * Usage:
 *   node scripts/release-escrow.mjs                    # inspect on-chain state
 *   node scripts/release-escrow.mjs --action auto      # pick best recovery step
 *   node scripts/release-escrow.mjs --action release   # buyer must sign (see BUYER_KEYPAIR)
 *   node scripts/release-escrow.mjs --action confirm-shipping
 *   node scripts/release-escrow.mjs --action resolve-dispute
 *
 * Env:
 *   BUYER_KEYPAIR  — path to buyer keypair JSON (required for release / open-dispute)
 *   SELLER_KEYPAIR — path to seller keypair JSON (defaults to deployer id.json)
 *   PLATFORM_KEYPAIR — path to platform keypair JSON (defaults to deployer id.json)
 */
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const PROGRAM_ID = new PublicKey(
  "DWvYLFF7iYYsZF97mYP7EhkEXXf1FPxs6SieTfgT5dYT"
);
const ESCROW_PDA = new PublicKey(
  "6rvMGANJ3FkotvpLtAs7qEQ15jApBPBYjU9n7bep38jk"
);
const AUCTION_UUID = "0d6df47b-7f0c-46fa-b37c-1ee67b3c0211";
const SELLER = new PublicKey("CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT");
const BUYER = new PublicKey("AriDmsLxCgsyMG1DyckYrAKfTCPa9hPDdV161iVfamu5");
const PLATFORM_WALLET = new PublicKey(
  "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT"
);
const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=602bcb09-8b78-413f-abea-ed804a479cfc";

const DEPLOYER_KEYPAIR_PATH = join(homedir(), ".config", "solana", "id.json");

const ESCROW_STATE_LABELS = [
  "Pending",
  "Funded",
  "Shipped",
  "Complete",
  "Disputed",
  "Refunded",
  "Cancelled",
  "Expired",
];

const IDL_SEARCH_PATHS = [
  join(REPO_ROOT, "target", "idl", "hype_escrow.json"),
  join(REPO_ROOT, "programs", "hype-escrow", "target", "idl", "hype_escrow.json"),
  join(REPO_ROOT, "..", "hype-auction-build", "target", "idl", "hype_escrow.json"),
];

/** Embedded fallback when anchor build output is unavailable locally. */
const FALLBACK_IDL = {
  metadata: { name: "hype_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [
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
};

function parseArgs(argv) {
  const actionIndex = argv.indexOf("--action");
  const action =
    actionIndex >= 0 ? argv[actionIndex + 1]?.trim() ?? "inspect" : "inspect";
  return { action };
}

function loadKeypair(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Keypair file not found: ${filePath}`);
  }
  const secret = JSON.parse(readFileSync(filePath, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function loadIdl() {
  for (const candidate of IDL_SEARCH_PATHS) {
    if (existsSync(candidate)) {
      console.log(`Using IDL: ${candidate}`);
      const idl = JSON.parse(readFileSync(candidate, "utf8"));
      idl.address = PROGRAM_ID.toBase58();
      return idl;
    }
  }

  console.warn(
    "IDL file not found in target/idl — using embedded fallback IDL for recovery instructions."
  );
  return {
    ...FALLBACK_IDL,
    address: PROGRAM_ID.toBase58(),
  };
}

function auctionUuidToBytes(uuid) {
  const padded = Buffer.alloc(32);
  Buffer.from(uuid.replace(/-/g, ""), "hex").copy(padded);
  return Array.from(padded);
}

function deriveEscrowPda(auctionIdBytes) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(auctionIdBytes)],
    PROGRAM_ID
  );
  return pda;
}

function formatEscrowState(state) {
  if (typeof state === "object" && state !== null) {
    const key = Object.keys(state)[0];
    return key ?? String(state);
  }
  if (typeof state === "number") {
    return ESCROW_STATE_LABELS[state] ?? `Unknown(${state})`;
  }
  return String(state);
}

function lamportsToSol(lamports) {
  return (Number(lamports) / 1_000_000_000).toFixed(4);
}

function createProgram(connection, payer) {
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  const idl = loadIdl();
  return new anchor.Program(idl, provider);
}

async function fetchEscrow(program, escrowPda) {
  const account = await program.account.escrowAccount.fetch(escrowPda);
  return account;
}

function printEscrowSummary(account, escrowPda) {
  const stateLabel = formatEscrowState(account.state);
  const totalLamports =
    Number(account.amountLamports) + Number(account.shippingLamports);

  console.log("\n--- Escrow account ---");
  console.log("PDA:", escrowPda.toBase58());
  console.log("State:", stateLabel);
  console.log("Buyer:", account.buyer.toBase58());
  console.log("Seller:", account.seller.toBase58());
  console.log("Platform:", account.platformWallet.toBase58());
  console.log(
    "Held:",
    `${lamportsToSol(totalLamports)} SOL (${totalLamports} lamports)`
  );
  console.log("Attempt:", account.attemptNumber);
  console.log("Funded at:", account.fundedAt?.toString?.() ?? account.fundedAt);
  console.log("Shipped at:", account.shippedAt?.toString?.() ?? account.shippedAt);
}

function recommendAction(stateLabel) {
  switch (stateLabel) {
    case "Funded":
      return "confirm-shipping (seller signs), then release (buyer signs)";
    case "Shipped":
      return "release (buyer signs) OR open-dispute (buyer) then resolve-dispute (platform)";
    case "Disputed":
      return "resolve-dispute with release_to_seller=true (platform signs)";
    case "Complete":
      return "already released — no action needed";
    case "Refunded":
      return "already refunded — no action needed";
    default:
      return "inspect contract state — manual intervention required";
  }
}

async function runConfirmShipping(program, auctionIdBytes, sellerKeypair, escrowPda) {
  console.log("\nSubmitting confirm_shipping (seller signer)...");
  const signature = await program.methods
    .confirmShipping(auctionIdBytes)
    .accounts({
      seller: sellerKeypair.publicKey,
      escrow: escrowPda,
    })
    .signers([sellerKeypair])
    .rpc();

  console.log("confirm_shipping signature:", signature);
  console.log(`https://explorer.solana.com/tx/${signature}`);
  return signature;
}

async function runRelease(
  program,
  auctionIdBytes,
  buyerKeypair,
  escrowPda
) {
  console.log("\nSubmitting release (buyer signer required)...");
  console.log("Buyer signer:", buyerKeypair.publicKey.toBase58());

  const signature = await program.methods
    .release(auctionIdBytes)
    .accounts({
      buyer: buyerKeypair.publicKey,
      seller: SELLER,
      platformWallet: PLATFORM_WALLET,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .signers([buyerKeypair])
    .rpc();

  console.log("release signature:", signature);
  console.log(`https://explorer.solana.com/tx/${signature}`);
  return signature;
}

async function runOpenDispute(program, auctionIdBytes, buyerKeypair, escrowPda) {
  console.log("\nSubmitting open_dispute (buyer signer)...");
  const signature = await program.methods
    .openDispute(auctionIdBytes)
    .accounts({
      buyer: buyerKeypair.publicKey,
      escrow: escrowPda,
    })
    .signers([buyerKeypair])
    .rpc();

  console.log("open_dispute signature:", signature);
  console.log(`https://explorer.solana.com/tx/${signature}`);
  return signature;
}

async function runResolveDispute(
  program,
  auctionIdBytes,
  platformKeypair,
  escrowPda
) {
  console.log("\nSubmitting resolve_dispute(release_to_seller=true) (platform signer)...");
  const signature = await program.methods
    .resolveDispute(auctionIdBytes, true)
    .accounts({
      platformWallet: platformKeypair.publicKey,
      buyer: BUYER,
      seller: SELLER,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .signers([platformKeypair])
    .rpc();

  console.log("resolve_dispute signature:", signature);
  console.log(`https://explorer.solana.com/tx/${signature}`);
  return signature;
}

async function main() {
  const { action } = parseArgs(process.argv.slice(2));
  const auctionIdBytes = auctionUuidToBytes(AUCTION_UUID);
  const derivedPda = deriveEscrowPda(auctionIdBytes);

  console.log("Hype Auction — escrow recovery (mainnet)");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Auction UUID:", AUCTION_UUID);
  console.log("Configured escrow PDA:", ESCROW_PDA.toBase58());
  console.log("Derived escrow PDA:", derivedPda.toBase58());

  if (!derivedPda.equals(ESCROW_PDA)) {
    console.warn(
      "WARNING: Derived PDA does not match configured ESCROW_PDA. Using configured PDA."
    );
  }

  const deployerKeypair = loadKeypair(DEPLOYER_KEYPAIR_PATH);
  console.log("Deployer / default signer:", deployerKeypair.publicKey.toBase58());

  const sellerKeypair = process.env.SELLER_KEYPAIR
    ? loadKeypair(process.env.SELLER_KEYPAIR)
    : deployerKeypair;
  const platformKeypair = process.env.PLATFORM_KEYPAIR
    ? loadKeypair(process.env.PLATFORM_KEYPAIR)
    : deployerKeypair;

  const connection = new Connection(RPC_URL, "confirmed");
  const program = createProgram(connection, deployerKeypair);

  const escrowAccount = await fetchEscrow(program, ESCROW_PDA);
  printEscrowSummary(escrowAccount, ESCROW_PDA);

  const stateLabel = formatEscrowState(escrowAccount.state);
  console.log("\nRecommended path:", recommendAction(stateLabel));

  console.log("\n--- Signer rules ---");
  console.log("release(): buyer MUST sign — deployer/admin cannot substitute.");
  console.log("confirm_shipping(): seller MUST sign.");
  console.log("resolve_dispute(): platform_wallet MUST sign.");

  if (action === "inspect") {
    console.log("\nNo transaction sent. Pass --action auto|release|confirm-shipping|resolve-dispute");
    return;
  }

  if (action === "auto") {
    if (stateLabel === "Funded") {
      if (!sellerKeypair.publicKey.equals(SELLER)) {
        throw new Error(
          `Seller keypair ${sellerKeypair.publicKey.toBase58()} does not match expected seller ${SELLER.toBase58()}. Set SELLER_KEYPAIR.`
        );
      }
      await runConfirmShipping(program, auctionIdBytes, sellerKeypair, ESCROW_PDA);
      console.log("\nRe-run with --action release after buyer provides BUYER_KEYPAIR.");
      return;
    }

    if (stateLabel === "Shipped") {
      const buyerKeypair = process.env.BUYER_KEYPAIR
        ? loadKeypair(process.env.BUYER_KEYPAIR)
        : deployerKeypair.publicKey.equals(BUYER)
          ? deployerKeypair
          : null;

      if (!buyerKeypair) {
        throw new Error(
          "Escrow is Shipped. release() requires the BUYER keypair.\n" +
            "Set BUYER_KEYPAIR=/path/to/buyer-keypair.json and run:\n" +
            "  node scripts/release-escrow.mjs --action release\n\n" +
            "Admin alternative (no buyer sig): buyer opens dispute, then platform runs resolve-dispute."
        );
      }

      await runRelease(program, auctionIdBytes, buyerKeypair, ESCROW_PDA);
      return;
    }

    if (stateLabel === "Disputed") {
      if (!platformKeypair.publicKey.equals(PLATFORM_WALLET)) {
        throw new Error(
          `Platform keypair ${platformKeypair.publicKey.toBase58()} does not match ${PLATFORM_WALLET.toBase58()}. Set PLATFORM_KEYPAIR.`
        );
      }
      await runResolveDispute(
        program,
        auctionIdBytes,
        platformKeypair,
        ESCROW_PDA
      );
      return;
    }

    throw new Error(`No automatic action for escrow state: ${stateLabel}`);
  }

  if (action === "confirm-shipping") {
    await runConfirmShipping(program, auctionIdBytes, sellerKeypair, ESCROW_PDA);
    return;
  }

  if (action === "release") {
    const buyerKeypair = process.env.BUYER_KEYPAIR
      ? loadKeypair(process.env.BUYER_KEYPAIR)
      : deployerKeypair.publicKey.equals(BUYER)
        ? deployerKeypair
        : null;

    if (!buyerKeypair) {
      throw new Error(
        "release() requires the buyer keypair.\n" +
          "The deployer keypair is NOT authorized — only the buyer can sign Release.\n" +
          "Export the buyer wallet keypair and set:\n" +
          "  BUYER_KEYPAIR=/path/to/buyer-keypair.json"
      );
    }

    if (!buyerKeypair.publicKey.equals(BUYER)) {
      throw new Error(
        `Buyer keypair ${buyerKeypair.publicKey.toBase58()} does not match expected buyer ${BUYER.toBase58()}`
      );
    }

    if (stateLabel !== "Shipped") {
      throw new Error(
        `release() requires escrow state Shipped, current state is ${stateLabel}`
      );
    }

    await runRelease(program, auctionIdBytes, buyerKeypair, ESCROW_PDA);
    return;
  }

  if (action === "open-dispute") {
    const buyerKeypair = process.env.BUYER_KEYPAIR
      ? loadKeypair(process.env.BUYER_KEYPAIR)
      : null;
    if (!buyerKeypair) {
      throw new Error("open_dispute requires BUYER_KEYPAIR");
    }
    await runOpenDispute(program, auctionIdBytes, buyerKeypair, ESCROW_PDA);
    return;
  }

  if (action === "resolve-dispute") {
    await runResolveDispute(
      program,
      auctionIdBytes,
      platformKeypair,
      ESCROW_PDA
    );
    return;
  }

  throw new Error(`Unknown action: ${action}`);
}

main().catch((error) => {
  console.error("\nRecovery failed:", error?.message ?? error);
  process.exit(1);
});
