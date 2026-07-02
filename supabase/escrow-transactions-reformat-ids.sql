-- One-time migration: reformat legacy HA-TXN-000001 IDs to the new per-event format.
-- Run in Supabase SQL Editor after deploying next_platform_transaction_id RPC.

UPDATE public.escrow_transactions
SET platform_transaction_id = 'HA-TXN-S5KREM-F000001'
WHERE event_type = 'funded'
  AND platform_transaction_id = 'HA-TXN-000001';

UPDATE public.escrow_transactions
SET platform_transaction_id = 'HA-TXN-S5KREM-SH000002'
WHERE event_type = 'shipped'
  AND platform_transaction_id = 'HA-TXN-000001';

UPDATE public.escrow_transactions
SET platform_transaction_id = 'HA-TXN-S5KREM-R000003'
WHERE event_type = 'released'
  AND platform_transaction_id = 'HA-TXN-000001';

UPDATE public.escrow_transactions
SET platform_transaction_id = 'HA-TXN-S5KREM-FE000004'
WHERE event_type = 'fee_collected'
  AND platform_transaction_id = 'HA-TXN-000001';

SELECT setval('platform_transaction_seq', 4);
