-- Run in Supabase Dashboard → SQL Editor
-- Extended auction fields for item detail pages

ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS additional_images TEXT[];
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS item_details JSONB;

-- If additional_images was previously created as jsonb, this migration is a no-op
-- for that column. Existing jsonb arrays remain compatible with the app parser.
