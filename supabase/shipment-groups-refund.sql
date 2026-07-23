-- Voluntary bundle shipping refund tracking (Stage 5)
-- Run in Supabase Dashboard → SQL Editor

alter table public.shipment_groups
  add column if not exists refund_sent_at timestamptz,
  add column if not exists refund_nudge_dismissed_at timestamptz,
  add column if not exists refund_tx_signature text;
