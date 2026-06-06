-- Hype Auction — run this in Supabase Dashboard → SQL Editor → New query

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  wallet_address text primary key,
  username       text,
  avatar_url     text,
  reputation     numeric(10, 2) not null default 0,
  created_at     timestamptz not null default now(),

  constraint users_wallet_address_length check (char_length(wallet_address) between 32 and 64),
  constraint users_username_length check (username is null or char_length(username) between 2 and 32),
  constraint users_reputation_non_negative check (reputation >= 0)
);

comment on table public.users is 'Profiles keyed by Solana wallet address';

-- ---------------------------------------------------------------------------
-- auctions
-- ---------------------------------------------------------------------------
create type public.auction_status as enum ('draft', 'live', 'ended', 'cancelled');

create table public.auctions (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  image_url      text,
  seller_wallet  text not null references public.users (wallet_address) on delete restrict,
  current_bid    numeric(18, 9) not null default 0,
  start_price    numeric(18, 9) not null,
  end_time       timestamptz not null,
  status         public.auction_status not null default 'draft',
  category       text,
  created_at     timestamptz not null default now(),

  constraint auctions_title_length check (char_length(title) between 1 and 200),
  constraint auctions_start_price_positive check (start_price > 0),
  constraint auctions_current_bid_non_negative check (current_bid >= 0),
  constraint auctions_end_time_future_on_create check (end_time > created_at)
);

create index auctions_status_idx on public.auctions (status);
create index auctions_end_time_idx on public.auctions (end_time);
create index auctions_seller_wallet_idx on public.auctions (seller_wallet);
create index auctions_category_idx on public.auctions (category);

comment on table public.auctions is 'Live and upcoming auction listings';

-- ---------------------------------------------------------------------------
-- bids
-- ---------------------------------------------------------------------------
create table public.bids (
  id             uuid primary key default gen_random_uuid(),
  auction_id     uuid not null references public.auctions (id) on delete cascade,
  bidder_wallet  text not null references public.users (wallet_address) on delete restrict,
  amount         numeric(18, 9) not null,
  created_at     timestamptz not null default now(),

  constraint bids_amount_positive check (amount > 0)
);

create index bids_auction_id_idx on public.bids (auction_id);
create index bids_bidder_wallet_idx on public.bids (bidder_wallet);
create index bids_auction_id_amount_idx on public.bids (auction_id, amount desc);

comment on table public.bids is 'Bid history per auction';

-- ---------------------------------------------------------------------------
-- Keep auctions.current_bid in sync with highest bid
-- ---------------------------------------------------------------------------
create or replace function public.sync_auction_current_bid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.auctions
  set current_bid = (
    select coalesce(max(amount), start_price)
    from public.bids
    where auction_id = new.auction_id
  )
  where id = new.auction_id;

  return new;
end;
$$;

create trigger bids_sync_auction_current_bid
after insert on public.bids
for each row
execute function public.sync_auction_current_bid();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;

-- Public read access for marketplace data
create policy "users are viewable by everyone"
  on public.users for select
  using (true);

create policy "auctions are viewable by everyone"
  on public.auctions for select
  using (true);

create policy "bids are viewable by everyone"
  on public.bids for select
  using (true);

-- Allow wallet connect to create / update user profiles
create policy "users can insert on connect"
  on public.users for insert
  to anon, authenticated
  with check (true);

create policy "users can update on connect"
  on public.users for update
  to anon, authenticated
  using (true)
  with check (true);

-- Allow placing bids and updating auction current_bid
create policy "bids can be inserted by anyone"
  on public.bids for insert
  to anon, authenticated
  with check (true);

create policy "auctions current_bid can be updated"
  on public.auctions for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "auctions can be inserted by anyone"
  on public.auctions for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- messages (live chat)
-- ---------------------------------------------------------------------------
create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  auction_id     uuid not null references public.auctions (id) on delete cascade,
  wallet_address text not null references public.users (wallet_address) on delete restrict,
  username       text not null,
  content        text not null,
  created_at     timestamptz not null default now(),

  constraint messages_content_length check (char_length(content) between 1 and 500),
  constraint messages_username_length check (char_length(username) between 3 and 32)
);

create index messages_auction_id_created_at_idx
  on public.messages (auction_id, created_at);

alter table public.messages enable row level security;

create policy "messages are viewable by everyone"
  on public.messages for select
  using (true);

create policy "messages can be inserted by anyone"
  on public.messages for insert
  to anon, authenticated
  with check (true);

alter publication supabase_realtime add table public.messages;
