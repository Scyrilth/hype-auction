-- Flat-rate seller shipping settings and per-listing shipping prices

alter table public.users add column if not exists country text;
alter table public.users add column if not exists ships_internationally boolean not null default false;

alter table public.auctions add column if not exists domestic_shipping_usd numeric(10, 2) not null default 0;
alter table public.auctions add column if not exists international_shipping_usd numeric(10, 2) not null default 0;
alter table public.auctions add column if not exists is_dummy boolean not null default false;
