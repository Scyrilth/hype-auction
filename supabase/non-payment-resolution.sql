-- Non-payment resolution fields for next-bidder offers and relists.
-- Run in Supabase SQL Editor.

ALTER TABLE public.auctions
ADD COLUMN IF NOT EXISTS next_bidder_offered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_bidder_response_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_bidder_wallet TEXT,
ADD COLUMN IF NOT EXISTS relisted_auction_id UUID REFERENCES public.auctions(id),
ADD COLUMN IF NOT EXISTS payment_excluded_wallets TEXT[] DEFAULT '{}';
