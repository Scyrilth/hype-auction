-- Watchlist + profile privacy
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null references public.users (wallet_address) on delete cascade,
  auction_id uuid not null references public.auctions (id) on delete cascade,
  created_at timestamptz default now(),
  unique (wallet_address, auction_id)
);

create index if not exists watchlist_wallet_idx
  on public.watchlist (wallet_address, created_at desc);

create index if not exists watchlist_auction_idx
  on public.watchlist (auction_id);

alter table public.watchlist enable row level security;

drop policy if exists "watchlist is viewable" on public.watchlist;
create policy "watchlist is viewable"
  on public.watchlist for select
  to anon, authenticated
  using (true);

drop policy if exists "watchlist can be inserted" on public.watchlist;
create policy "watchlist can be inserted"
  on public.watchlist for insert
  to anon, authenticated
  with check (true);

drop policy if exists "watchlist can be deleted" on public.watchlist;
create policy "watchlist can be deleted"
  on public.watchlist for delete
  to anon, authenticated
  using (true);

alter table public.users
  add column if not exists show_won_auctions boolean default false;
