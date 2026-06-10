-- Backfill dummy transaction rows with a realistic stored SOL/USD rate
UPDATE public.auctions
SET sol_usd_rate_at_payment = 64.50,
    payment_completed_at = end_time
WHERE escrow_tx_signature LIKE 'dummy_tx_%';
