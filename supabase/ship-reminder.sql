-- Proactive seller ship reminder tracking
-- Run in Supabase Dashboard → SQL Editor

alter table public.auctions
  add column if not exists ship_reminder_sent boolean not null default false;

create index if not exists auctions_ship_reminder_pending_idx
  on public.auctions (payment_completed_at)
  where ship_reminder_sent = false
    and escrow_state = 'funded'
    and status = 'ended';
