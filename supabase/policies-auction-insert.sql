-- Run in Supabase SQL Editor if creating auctions from the dashboard fails

create policy "auctions can be inserted by anyone"
  on public.auctions for insert
  to anon, authenticated
  with check (true);
