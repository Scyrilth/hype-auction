-- Per-thread buyer shipping address selection (pre-payment)
-- Run in Supabase SQL Editor

ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS shipping_address_id UUID
    REFERENCES public.shipping_addresses (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_usd NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_country TEXT;

CREATE INDEX IF NOT EXISTS message_threads_shipping_address_idx
  ON public.message_threads (shipping_address_id)
  WHERE shipping_address_id IS NOT NULL;
