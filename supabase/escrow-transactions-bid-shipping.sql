-- Add bid/shipping breakdown columns to escrow ledger (run in Supabase SQL Editor)

ALTER TABLE public.escrow_transactions
  ADD COLUMN IF NOT EXISTS bid_lamports BIGINT,
  ADD COLUMN IF NOT EXISTS shipping_lamports BIGINT;
