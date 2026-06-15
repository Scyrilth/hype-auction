-- Refresh dummy auction listings to stay live during development.
-- Run periodically in Supabase SQL Editor (e.g. weekly) while using test data.

UPDATE public.auctions
SET end_time = NOW() + INTERVAL '7 days',
    status = 'live'
WHERE is_dummy = true;
