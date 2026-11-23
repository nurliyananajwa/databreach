-- Live updates: the app listens for new alerts and new audit log entries.
-- Supabase Realtime applies the same RLS rules to every event it sends, so a
-- person only receives their own alerts, and only managers receive audit log
-- entries (policy audit_read). No other table is published.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.alerts, public.audit_log;
  end if;
end $$;
