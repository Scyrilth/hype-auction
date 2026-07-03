/**
 * Anchor IDL for hype_escrow (spec 0.1.0).
 * Program address is injected at runtime from NEXT_PUBLIC_PROGRAM_ID.
 */
export const HYPE_ESCROW_IDL = {
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
      name: "auto_release",
      discriminator: [212, 34, 30, 246, 192, 13, 97, 31],
      accounts: [
        { name: "seller", writable: true },
        { name: "platform_wallet", writable: true },
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
} as const;
