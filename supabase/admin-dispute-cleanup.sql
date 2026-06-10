-- Run in Supabase SQL Editor: remove legacy dummy Rolex from open disputes.
-- Keeps the newer admin_dummy dispute record; moves old dummy_tx_009 Rolex to released.

UPDATE public.auctions
SET escrow_state = 'released'
WHERE escrow_tx_signature LIKE 'dummy_tx_009%'
  AND title ILIKE '%Rolex%'
  AND escrow_state = 'disputed';
