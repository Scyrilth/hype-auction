-- Named seller shipping profiles (listing data-entry shortcuts)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.shipping_profiles (
  id uuid primary key default gen_random_uuid(),
  seller_wallet text not null references public.users (wallet_address) on delete cascade,
  name text not null,
  category text not null,
  domestic_shipping_usd numeric(10, 2) not null default 0,
  international_shipping_usd numeric(10, 2) not null default 0,
  ships_internationally boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists shipping_profiles_seller_idx
  on public.shipping_profiles (seller_wallet, created_at desc);

alter table public.shipping_profiles enable row level security;

-- Intended for server-side wallet session config (optional)
drop policy if exists "Users can manage own shipping profiles" on public.shipping_profiles;
create policy "Users can manage own shipping profiles"
  on public.shipping_profiles
  for all
  to public
  using (seller_wallet = current_setting('app.wallet', true));

-- Client uses seller_wallet in row + app-layer checks (matches shipping_addresses pattern)
drop policy if exists "shipping profiles are viewable" on public.shipping_profiles;
create policy "shipping profiles are viewable"
  on public.shipping_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "shipping profiles can be inserted" on public.shipping_profiles;
create policy "shipping profiles can be inserted"
  on public.shipping_profiles for insert
  to anon, authenticated
  with check (true);

drop policy if exists "shipping profiles can be updated" on public.shipping_profiles;
create policy "shipping profiles can be updated"
  on public.shipping_profiles for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "shipping profiles can be deleted" on public.shipping_profiles;
create policy "shipping profiles can be deleted"
  on public.shipping_profiles for delete
  to anon, authenticated
  using (true);
