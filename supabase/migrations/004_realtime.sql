-- 004_realtime.sql
-- Enable Postgres CDC for the `orders` table so staff dashboards receive
-- INSERT/UPDATE events over Realtime instead of polling every few seconds.
-- RLS still governs which rows each subscriber receives (same policies as
-- the REST path), so no new security surface is introduced.
-- Idempotent: safe to re-run (skips if `orders` is already published).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;
