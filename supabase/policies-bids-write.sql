-- Run in Supabase SQL Editor if bid placement fails with RLS errors

create policy "bids can be inserted by anyone"
  on public.bids for insert
  to anon, authenticated
  with check (true);

create policy "auctions current_bid can be updated"
  on public.auctions for update
  to anon, authenticated
  using (true)
  with check (true);
