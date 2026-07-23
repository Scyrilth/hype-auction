-- Multi-item shipping bundles (seller groups paid orders for one tracking upload)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.shipment_groups (
  id uuid primary key default gen_random_uuid(),
  bundle_reference text not null,
  seller_wallet text not null references public.users (wallet_address) on delete cascade,
  buyer_wallet text not null references public.users (wallet_address) on delete cascade,
  tracking_courier text,
  tracking_number text,
  created_at timestamptz default now()
);

create unique index if not exists shipment_groups_bundle_reference_unique_idx
  on public.shipment_groups (bundle_reference);

create index if not exists shipment_groups_seller_idx
  on public.shipment_groups (seller_wallet, created_at desc);

create index if not exists shipment_groups_buyer_idx
  on public.shipment_groups (buyer_wallet);

alter table public.auctions
  add column if not exists shipment_group_id uuid references public.shipment_groups (id) on delete set null;

create index if not exists auctions_shipment_group_idx
  on public.auctions (shipment_group_id)
  where shipment_group_id is not null;

alter table public.shipment_groups enable row level security;

-- Intended for server-side wallet session config (optional)
drop policy if exists "Users can manage own shipment groups" on public.shipment_groups;
create policy "Users can manage own shipment groups"
  on public.shipment_groups
  for all
  to public
  using (seller_wallet = current_setting('app.wallet', true));

-- Client uses seller_wallet in row + app-layer checks (matches shipping_profiles pattern)
drop policy if exists "shipment groups are viewable" on public.shipment_groups;
create policy "shipment groups are viewable"
  on public.shipment_groups for select
  to anon, authenticated
  using (true);

drop policy if exists "shipment groups can be inserted" on public.shipment_groups;
create policy "shipment groups can be inserted"
  on public.shipment_groups for insert
  to anon, authenticated
  with check (true);

drop policy if exists "shipment groups can be updated" on public.shipment_groups;
create policy "shipment groups can be updated"
  on public.shipment_groups for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "shipment groups can be deleted" on public.shipment_groups;
create policy "shipment groups can be deleted"
  on public.shipment_groups for delete
  to anon, authenticated
  using (true);
