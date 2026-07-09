-- Buy Now listing types (run in Supabase SQL Editor)

ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS buy_now_price NUMERIC,
  ADD COLUMN IF NOT EXISTS purchase_type TEXT
    DEFAULT 'auction',
  ADD COLUMN IF NOT EXISTS listing_type TEXT
    DEFAULT 'auction',
  ADD COLUMN IF NOT EXISTS good_till_cancelled
    BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS auctions_buy_now_idx
  ON public.auctions (buy_now_price)
  WHERE buy_now_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS auctions_gtc_idx
  ON public.auctions (good_till_cancelled, status)
  WHERE good_till_cancelled = TRUE;
