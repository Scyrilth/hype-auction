/**
 * Local validator integration test: platform fee is 4% of bid only (not shipping).
 *
 * Prerequisites:
 *   - solana-test-validator at http://localhost:8899
 *   - Program FSfoXgb1g1zuW2n9VyUegWqf9fc6mfdaRrND4nFdLkMS deployed
 *   - IDL at target/idl/hype_escrow.json
 *
 * Run: npx ts-node scripts/test-fee-split.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { BN, Program, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { randomUUID } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const RPC_URL = "http://localhost:8899";
const PROGRAM_ID = new PublicKey(
  "FSfoXgb1g1zuW2n9VyUegWqf9fc6mfdaRrND4nFdLkMS"
);
const IDL_PATH = join(process.cwd(), "target", "idl", "hype_escrow.json");
const IDL_PATH_WSL = "/mnt/c/Users/ahsan/hype-auction/target/idl/hype_escrow.json";

const AIRDROP_SOL = 2;
const BID_LAMPORTS = LAMPORTS_PER_SOL;
const SHIPPING_LAMPORTS = Math.floor(0.1 * LAMPORTS_PER_SOL);
const PLATFORM_FEE_BPS = 400;
const EXPECTED_FEE_LAMPORTS = 40_000_000;
const OLD_BEHAVIOR_FEE_LAMPORTS = 44_000_000;

function auctionIdToBytes(auctionId: string): number[] {
  const hex = auctionId.replace(/-/g, "");
  const buf = Buffer.alloc(32);
  Buffer.from(hex, "hex").copy(buf);
  return Array.from(buf);
}

function getEscrowPda(auctionId: string): PublicKey {
  const auctionIdBytes = Buffer.from(auctionId.replace(/-/g, ""), "hex");
  const padded = Buffer.alloc(32);
  auctionIdBytes.copy(padded);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), padded],
    PROGRAM_ID
  );
  return pda;
}

function loadIdl(): Idl {
  const idlPath = [IDL_PATH_WSL, IDL_PATH].find((candidate) =>
    existsSync(candidate)
  );
  if (!idlPath) {
    throw new Error(`IDL not found at ${IDL_PATH_WSL} or ${IDL_PATH}`);
  }
  console.log("Using IDL:", idlPath);
  const idl = JSON.parse(readFileSync(idlPath, "utf8")) as Idl;
  idl.address = PROGRAM_ID.toBase58();
  return idl;
}

function formatSol(lamports: number): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(3)} SOL`;
}

async function airdropSol(
  connection: Connection,
  pubkey: PublicKey,
  sol: number
): Promise<void> {
  const sig = await connection.requestAirdrop(
    pubkey,
    sol * LAMPORTS_PER_SOL
  );
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
}

async function main(): Promise<void> {
  const buyer = Keypair.generate();
  const seller = Keypair.generate();
  const platform = Keypair.generate();

  console.log("RPC:", RPC_URL);
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Buyer:", buyer.publicKey.toBase58());
  console.log("Seller:", seller.publicKey.toBase58());
  console.log("Platform:", platform.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const version = await connection.getVersion();
  console.log("Validator:", version["solana-core"]);

  console.log(`Airdropping ${AIRDROP_SOL} SOL to buyer, seller, platform...`);
  await airdropSol(connection, buyer.publicKey, AIRDROP_SOL);
  await airdropSol(connection, seller.publicKey, AIRDROP_SOL);
  await airdropSol(connection, platform.publicKey, AIRDROP_SOL);

  const platformBefore = await connection.getBalance(platform.publicKey);
  console.log("Platform balance BEFORE:", formatSol(platformBefore));

  const auctionId = randomUUID();
  const auctionIdBytes = auctionIdToBytes(auctionId);
  const escrowPda = getEscrowPda(auctionId);
  const idl = loadIdl();

  console.log("Auction ID:", auctionId);
  console.log("Escrow PDA:", escrowPda.toBase58());
  console.log(
    `Escrow terms: bid=${formatSol(BID_LAMPORTS)}, shipping=${formatSol(SHIPPING_LAMPORTS)}, fee=${PLATFORM_FEE_BPS} bps`
  );

  const buyerProvider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(buyer),
    { commitment: "confirmed" }
  );
  const buyerProgram = new Program(idl, buyerProvider);

  const initSig = await buyerProgram.methods
    .initializeEscrow(
      auctionIdBytes,
      seller.publicKey,
      platform.publicKey,
      new BN(BID_LAMPORTS),
      new BN(SHIPPING_LAMPORTS),
      PLATFORM_FEE_BPS,
      1
    )
    .accounts({
      buyer: buyer.publicKey,
      seller: seller.publicKey,
      platformWallet: platform.publicKey,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("initializeEscrow tx:", initSig);

  const depositSig = await buyerProgram.methods
    .deposit(auctionIdBytes)
    .accounts({
      buyer: buyer.publicKey,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("deposit tx:", depositSig);

  const sellerProvider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(seller),
    { commitment: "confirmed" }
  );
  const sellerProgram = new Program(idl, sellerProvider);

  const shipSig = await sellerProgram.methods
    .confirmShipping(auctionIdBytes)
    .accounts({
      seller: seller.publicKey,
      escrow: escrowPda,
    })
    .rpc();
  console.log("confirmShipping tx:", shipSig);

  const releaseSig = await buyerProgram.methods
    .release(auctionIdBytes)
    .accounts({
      buyer: buyer.publicKey,
      seller: seller.publicKey,
      platformWallet: platform.publicKey,
      escrow: escrowPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("release tx:", releaseSig);

  const platformAfter = await connection.getBalance(platform.publicKey);
  const feeReceived = platformAfter - platformBefore;

  console.log("");
  console.log("Platform balance AFTER:", formatSol(platformAfter));
  console.log(
    "Expected fee (4% of bid only):",
    formatSol(EXPECTED_FEE_LAMPORTS)
  );
  console.log("Actual fee received:", formatSol(feeReceived));

  if (feeReceived === EXPECTED_FEE_LAMPORTS) {
    console.log("PASS");
    return;
  }

  if (feeReceived === OLD_BEHAVIOR_FEE_LAMPORTS) {
    console.log("FAIL (old behavior: 4% on bid + shipping = 0.044 SOL)");
    process.exitCode = 1;
    return;
  }

  console.log(`FAIL (unexpected fee amount: ${formatSol(feeReceived)})`);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
