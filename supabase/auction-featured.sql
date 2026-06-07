-- Featured auction flag for label badges
-- Run in Supabase Dashboard → SQL Editor

alter table public.auctions
  add column if not exists is_featured boolean default false;

create index if not exists auctions_is_featured_idx
  on public.auctions (is_featured)
  where is_featured = true;
