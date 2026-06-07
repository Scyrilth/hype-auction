-- Notifications — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications access" ON public.notifications;
CREATE POLICY "notifications access" ON public.notifications FOR ALL TO public USING (true);

CREATE INDEX IF NOT EXISTS notifications_wallet_read_created_idx
  ON public.notifications (wallet_address, is_read, created_at DESC);
