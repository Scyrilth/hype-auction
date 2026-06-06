-- Run in Supabase SQL Editor to enable live chat

-- ---------------------------------------------------------------------------
-- messages
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

comment on table public.messages is 'Live chat messages per auction';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

create policy "messages are viewable by everyone"
  on public.messages for select
  using (true);

create policy "messages can be inserted by anyone"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Realtime (required for instant message delivery)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
