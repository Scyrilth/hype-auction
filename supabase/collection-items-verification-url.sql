-- Add verification URL for collection item estimate references
ALTER TABLE public.collection_items
ADD COLUMN IF NOT EXISTS verification_url TEXT;
