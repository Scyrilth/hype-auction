-- Auction columns used by expire-escrow and auto-release crons
-- Run in Supabase SQL Editor

ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS auctions_expire_escrow_idx
  ON public.auctions (escrow_state, payment_deadline)
  WHERE escrow_state = 'pending' AND status = 'ended';

CREATE INDEX IF NOT EXISTS auctions_auto_release_idx
  ON public.auctions (escrow_state, shipped_at)
  WHERE escrow_state = 'shipped' AND status = 'ended';

-- Backfill shipped_at from tracking upload time where available.
UPDATE public.auctions
SET shipped_at = tracking_uploaded_at
WHERE shipped_at IS NULL
  AND tracking_uploaded_at IS NOT NULL;

-- Backfill payment_deadline for pending escrows (attempt 1 = 10 min after end_time).
UPDATE public.auctions
SET payment_deadline = end_time + interval '10 minutes'
WHERE payment_deadline IS NULL
  AND escrow_state = 'pending'
  AND status = 'ended'
  AND escrow_attempt_number = 1;
