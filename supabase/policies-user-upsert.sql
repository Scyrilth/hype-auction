-- Run in Supabase SQL Editor if wallet connect upserts fail with RLS errors

create policy "users can insert on connect"
  on public.users for insert
  to anon, authenticated
  with check (true);

create policy "users can update on connect"
  on public.users for update
  to anon, authenticated
  using (true)
  with check (true);
