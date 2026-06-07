-- Run in Supabase SQL Editor if uploads fail with permission errors.
-- Buckets 'Avatars', 'Banners', and 'Auction-images' must exist and be public.

-- Example policies (adjust if you already have storage RLS configured):

-- Allow public read
-- create policy "Public read avatars"
--   on storage.objects for select
--   using (bucket_id = 'Avatars');

-- Allow authenticated/anon uploads (wallet-gated apps often use anon + path checks)
-- create policy "Anyone can upload avatars"
--   on storage.objects for insert
--   to anon, authenticated
--   with check (bucket_id = 'Avatars');

-- create policy "Anyone can update avatars"
--   on storage.objects for update
--   to anon, authenticated
--   using (bucket_id = 'Avatars');
