-- Refresh dummy auction listings to stay live during development.
-- Run periodically in Supabase SQL Editor (e.g. weekly) while using test data.
-- Excludes admin dispute dummy auctions (admin_dummy_% escrow signatures).

UPDATE public.auctions
SET end_time = NOW() + INTERVAL '7 days',
    status = 'live'
WHERE is_dummy = true
  AND escrow_tx_signature NOT LIKE 'admin_dummy_%';
