-- Message thread escrow + shipping fields
-- Run in Supabase SQL Editor BEFORE deploying the seller post-auction flow.

ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS escrow_status TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS message_threads_seller_escrow_idx
  ON public.message_threads (seller_wallet, escrow_status)
  WHERE status = 'active';

-- Backfill escrow_status from auctions for existing threads.
UPDATE public.message_threads mt
SET escrow_status = a.escrow_state
FROM public.auctions a
WHERE mt.auction_id = a.id
  AND mt.escrow_status IS NULL
  AND a.escrow_state IS NOT NULL
  AND a.escrow_state <> 'none';

-- Backfill tracking from auctions where already shipped.
UPDATE public.message_threads mt
SET
  tracking_number = a.tracking_number,
  carrier = a.tracking_courier,
  shipped_at = a.tracking_uploaded_at,
  escrow_status = COALESCE(mt.escrow_status, 'shipped')
FROM public.auctions a
WHERE mt.auction_id = a.id
  AND a.tracking_number IS NOT NULL
  AND mt.tracking_number IS NULL;
