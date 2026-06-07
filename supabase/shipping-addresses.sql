-- Shipping addresses for buyer profiles
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references public.users (wallet_address) on delete cascade,
  nickname text not null default 'Home',
  full_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  phone text,
  is_default boolean default false,
  used_for_auction_id uuid references public.auctions (id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists shipping_addresses_wallet_idx
  on public.shipping_addresses (wallet_address, created_at desc);

alter table public.shipping_addresses enable row level security;

-- Intended for server-side wallet session config (optional)
drop policy if exists "Users can manage own addresses" on public.shipping_addresses;
create policy "Users can manage own addresses"
  on public.shipping_addresses
  for all
  to public
  using (wallet_address = current_setting('app.wallet', true));

-- Client uses wallet in row + app-layer checks (matches bids/reviews pattern)
drop policy if exists "shipping addresses are viewable" on public.shipping_addresses;
create policy "shipping addresses are viewable"
  on public.shipping_addresses for select
  to anon, authenticated
  using (true);

drop policy if exists "shipping addresses can be inserted" on public.shipping_addresses;
create policy "shipping addresses can be inserted"
  on public.shipping_addresses for insert
  to anon, authenticated
  with check (true);

drop policy if exists "shipping addresses can be updated" on public.shipping_addresses;
create policy "shipping addresses can be updated"
  on public.shipping_addresses for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "shipping addresses can be deleted" on public.shipping_addresses;
create policy "shipping addresses can be deleted"
  on public.shipping_addresses for delete
  to anon, authenticated
  using (true);
