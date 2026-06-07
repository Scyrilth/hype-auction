-- Run in Supabase Dashboard → SQL Editor
-- Adds extended listing fields for the seller create flow

alter table public.auctions
  add column if not exists condition text,
  add column if not exists additional_images jsonb not null default '[]'::jsonb,
  add column if not exists item_details jsonb not null default '{}'::jsonb;

comment on column public.auctions.condition is 'Item condition label (New, PSA 10, etc.)';
comment on column public.auctions.additional_images is 'Array of extra image URLs';
comment on column public.auctions.item_details is 'Key/value item detail pairs';
