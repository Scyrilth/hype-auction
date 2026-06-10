-- Store SOL/USD rate at payment time for accurate historical USD values
ALTER TABLE public.auctions
ADD COLUMN IF NOT EXISTS sol_usd_rate_at_payment NUMERIC(12, 4),
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
