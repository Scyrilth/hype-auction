-- Reviews system extensions — run in Supabase SQL Editor

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS seller_reply_at TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- One review per auction per reviewer
CREATE UNIQUE INDEX IF NOT EXISTS reviews_reviewer_auction_unique
  ON public.reviews (reviewer_wallet, auction_id)
  WHERE auction_id IS NOT NULL;

-- Recalculate vendor rating excluding flagged reviews; sync reputation
CREATE OR REPLACE FUNCTION public.refresh_vendor_stats(p_wallet text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sales integer;
  v_volume numeric(18, 9);
  v_rating numeric(3, 2);
BEGIN
  SELECT count(*), coalesce(sum(current_bid), 0)
  INTO v_sales, v_volume
  FROM public.auctions
  WHERE seller_wallet = p_wallet
    AND status = 'ended';

  SELECT coalesce(round(avg(rating)::numeric, 2), 0)
  INTO v_rating
  FROM public.reviews
  WHERE vendor_wallet = p_wallet
    AND coalesce(is_flagged, false) = false;

  UPDATE public.users
  SET
    total_sales = v_sales,
    total_volume = v_volume,
    average_rating = v_rating,
    reputation = v_rating
  WHERE wallet_address = p_wallet;
END;
$$;

-- RLS: allow updates for replies and flags
DROP POLICY IF EXISTS "reviews can be updated by anyone" ON public.reviews;
CREATE POLICY "reviews can be updated by anyone"
  ON public.reviews FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
