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
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_wallet_read_created_idx
  ON public.notifications (wallet_address, is_read, created_at DESC);

-- Enable realtime delivery (Dashboard → Database → Replication if this fails)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
