-- Escrow tracking columns on auctions
ALTER TABLE public.auctions
ADD COLUMN IF NOT EXISTS escrow_pda TEXT,
ADD COLUMN IF NOT EXISTS escrow_tx_signature TEXT,
ADD COLUMN IF NOT EXISTS escrow_funded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escrow_funded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escrow_amount_lamports BIGINT,
ADD COLUMN IF NOT EXISTS escrow_attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS escrow_state TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS escrow_expired_at TIMESTAMPTZ;

-- Buyer non-payment strikes
CREATE TABLE IF NOT EXISTS public.buyer_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address),
  auction_id UUID REFERENCES public.auctions(id),
  reason TEXT NOT NULL DEFAULT 'non_payment',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '6 months'
);

ALTER TABLE public.buyer_strikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strikes access" ON public.buyer_strikes FOR ALL TO public USING (true);
