-- ============================================================================
-- 002_retention_cron.sql
-- 90-day order retention via pg_cron — replaces the purge Edge Function
-- entirely (review §2.2): zero invocations, zero cold starts, no service-role
-- key on a network-callable endpoint.
--
-- Requires the pg_cron extension (one-time, dashboard → Database →
-- Extensions, or: create extension if not exists pg_cron;).
-- Schedule: daily at 03:00 UTC.
-- ============================================================================

-- Idempotent: drop + recreate keeps this migration re-runnable.
select cron.unschedule('purge-old-orders')
where exists (
  select 1 from cron.job where jobname = 'purge-old-orders'
);

select cron.schedule(
  'purge-old-orders',
  '0 3 * * *',
  $$delete from orders where created_at < now() - interval '90 days'$$
);