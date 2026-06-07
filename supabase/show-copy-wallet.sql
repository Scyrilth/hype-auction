-- Run in Supabase Dashboard → SQL Editor
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS show_copy_wallet BOOLEAN DEFAULT true;
