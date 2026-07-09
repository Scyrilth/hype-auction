-- Early auction end tracking (run in Supabase SQL Editor before deploying app changes)
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS ended_early BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS early_end_reason TEXT,
  ADD COLUMN IF NOT EXISTS early_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_end_by TEXT,
  ADD COLUMN IF NOT EXISTS winner_wallet TEXT;

CREATE INDEX IF NOT EXISTS auctions_early_end_idx
  ON public.auctions (ended_early, early_end_at DESC)
  WHERE ended_early = TRUE AND early_end_reason IS NOT NULL;
