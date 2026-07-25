-- Wallet sign-in challenge nonces (SIWS-style auth)
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.wallet_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  nonce text not null unique,
  wallet_address text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_auth_challenges_wallet_idx
  on public.wallet_auth_challenges (wallet_address);

create index if not exists wallet_auth_challenges_expires_idx
  on public.wallet_auth_challenges (expires_at);

alter table public.wallet_auth_challenges enable row level security;
