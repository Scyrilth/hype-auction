-- Direct messaging — buyer ↔ seller threads
-- Run in Supabase SQL Editor

ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'completed';

CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id),
  buyer_wallet TEXT NOT NULL REFERENCES public.users(wallet_address),
  seller_wallet TEXT NOT NULL REFERENCES public.users(wallet_address),
  status TEXT NOT NULL DEFAULT 'active',
  confirmed_at TIMESTAMPTZ,
  archive_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_threads_status_check CHECK (status IN ('active', 'archived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS message_threads_auction_buyer_unique
  ON public.message_threads (auction_id, buyer_wallet)
  WHERE auction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS message_threads_general_inquiry_unique
  ON public.message_threads (buyer_wallet, seller_wallet)
  WHERE auction_id IS NULL;

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_wallet TEXT NOT NULL REFERENCES public.users(wallet_address),
  content TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direct_messages_thread_id_idx
  ON public.direct_messages (thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS message_threads_buyer_idx
  ON public.message_threads (buyer_wallet, status);

CREATE INDEX IF NOT EXISTS message_threads_seller_idx
  ON public.message_threads (seller_wallet, status);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thread access" ON public.message_threads;
CREATE POLICY "thread access" ON public.message_threads FOR ALL TO public USING (true);

DROP POLICY IF EXISTS "message access" ON public.direct_messages;
CREATE POLICY "message access" ON public.direct_messages FOR ALL TO public USING (true);
