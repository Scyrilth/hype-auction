-- Vendor shop system — run in Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- Extend users for vendor profiles
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists shop_name text,
  add column if not exists banner_url text,
  add column if not exists bio text,
  add column if not exists shop_description text,
  add column if not exists twitter_url text,
  add column if not exists instagram_url text,
  add column if not exists is_vendor boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists followers_count integer not null default 0,
  add column if not exists total_sales integer not null default 0,
  add column if not exists total_volume numeric(18, 9) not null default 0,
  add column if not exists average_rating numeric(3, 2) not null default 0;

create unique index if not exists users_username_lower_idx
  on public.users (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_wallet  text not null references public.users (wallet_address) on delete cascade,
  following_wallet text not null references public.users (wallet_address) on delete cascade,
  created_at       timestamptz not null default now(),

  primary key (follower_wallet, following_wallet),
  constraint follows_no_self check (follower_wallet <> following_wallet)
);

create index if not exists follows_following_wallet_idx
  on public.follows (following_wallet);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id               uuid primary key default gen_random_uuid(),
  vendor_wallet    text not null references public.users (wallet_address) on delete cascade,
  reviewer_wallet  text not null references public.users (wallet_address) on delete restrict,
  auction_id       uuid references public.auctions (id) on delete set null,
  rating           integer not null,
  comment          text,
  created_at       timestamptz not null default now(),

  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_comment_length check (
    comment is null or char_length(comment) between 1 and 1000
  )
);

create index if not exists reviews_vendor_wallet_idx
  on public.reviews (vendor_wallet, created_at desc);

-- ---------------------------------------------------------------------------
-- Sync vendor stats from auctions + reviews
-- ---------------------------------------------------------------------------
create or replace function public.refresh_vendor_stats(p_wallet text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sales integer;
  v_volume numeric(18, 9);
  v_rating numeric(3, 2);
begin
  select count(*), coalesce(sum(current_bid), 0)
  into v_sales, v_volume
  from public.auctions
  where seller_wallet = p_wallet
    and status = 'ended';

  select coalesce(round(avg(rating)::numeric, 2), 0)
  into v_rating
  from public.reviews
  where vendor_wallet = p_wallet;

  update public.users
  set
    total_sales = v_sales,
    total_volume = v_volume,
    average_rating = v_rating
  where wallet_address = p_wallet;
end;
$$;

create or replace function public.toggle_follow(
  p_follower text,
  p_following text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_following boolean;
begin
  if p_follower = p_following then
    raise exception 'Cannot follow yourself';
  end if;

  if exists (
    select 1
    from public.follows
    where follower_wallet = p_follower
      and following_wallet = p_following
  ) then
    delete from public.follows
    where follower_wallet = p_follower
      and following_wallet = p_following;

    update public.users
    set followers_count = greatest(followers_count - 1, 0)
    where wallet_address = p_following;

    return false;
  end if;

  insert into public.follows (follower_wallet, following_wallet)
  values (p_follower, p_following);

  update public.users
  set followers_count = followers_count + 1
  where wallet_address = p_following;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.follows enable row level security;
alter table public.reviews enable row level security;

create policy "follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "follows can be inserted by anyone"
  on public.follows for insert
  to anon, authenticated
  with check (true);

create policy "follows can be deleted by anyone"
  on public.follows for delete
  to anon, authenticated
  using (true);

create policy "reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "reviews can be inserted by anyone"
  on public.reviews for insert
  to anon, authenticated
  with check (true);
