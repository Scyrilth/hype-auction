-- Collections feature — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet TEXT NOT NULL REFERENCES public.users(wallet_address),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  categories TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT true,
  item_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  owner_wallet TEXT NOT NULL REFERENCES public.users(wallet_address),
  name TEXT NOT NULL,
  category TEXT,
  condition TEXT,
  grading_company TEXT,
  grade TEXT,
  grade_label TEXT,
  year INTEGER,
  brand TEXT,
  images TEXT[] DEFAULT '{}',
  notes TEXT,
  estimated_value_sol NUMERIC,
  verification_url TEXT,
  acquisition_method TEXT DEFAULT 'other',
  item_details JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS public.collection_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collections access" ON public.collections;
CREATE POLICY "collections access" ON public.collections FOR ALL TO public USING (true);

DROP POLICY IF EXISTS "collection_items access" ON public.collection_items;
CREATE POLICY "collection_items access" ON public.collection_items FOR ALL TO public USING (true);

DROP POLICY IF EXISTS "collection_likes access" ON public.collection_likes;
CREATE POLICY "collection_likes access" ON public.collection_likes FOR ALL TO public USING (true);

DROP POLICY IF EXISTS "collection_comments access" ON public.collection_comments;
CREATE POLICY "collection_comments access" ON public.collection_comments FOR ALL TO public USING (true);

CREATE INDEX IF NOT EXISTS collections_public_likes_idx
  ON public.collections (is_public, like_count DESC);

CREATE INDEX IF NOT EXISTS collection_items_collection_idx
  ON public.collection_items (collection_id, display_order, created_at);

CREATE INDEX IF NOT EXISTS collection_likes_collection_idx
  ON public.collection_likes (collection_id);

CREATE INDEX IF NOT EXISTS collection_comments_collection_idx
  ON public.collection_comments (collection_id, created_at DESC);
