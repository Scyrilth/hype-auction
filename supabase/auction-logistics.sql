-- Auction reference numbers and shipping / tracking fields

alter table public.auctions add column if not exists reference_number text;
alter table public.auctions add column if not exists tracking_courier text;
alter table public.auctions add column if not exists tracking_number text;
alter table public.auctions add column if not exists tracking_uploaded_at timestamptz;
alter table public.auctions add column if not exists shipping_status text default 'pending';

-- shipping_status values: 'pending' | 'shipped' | 'delivered'

create unique index if not exists auctions_reference_number_unique_idx
  on public.auctions (reference_number)
  where reference_number is not null;
