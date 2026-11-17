-- In-app deadline alerts: 24 hours left, 6 hours left, overdue.
-- Leads get every alert; managers also get overdue ones (escalation).

create function private.generate_alerts() returns int
language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  with due as (
    select d.id as deadline_id, d.incident_id, d.type, d.due_at, i.org_id, i.code,
           case when now() > d.due_at                         then 'overdue'
                when d.due_at - now() <= interval '6 hours'   then 'warning'
                when d.due_at - now() <= interval '24 hours'  then 'info' end as level
    from public.deadlines d
    join public.incidents i on i.id = d.incident_id
    where d.status = 'open' and not d.provisional and i.status <> 'closed'
  ), who as (
    select due.*, p.id as user_id
    from due join public.profiles p on p.org_id = due.org_id and p.is_active
    where due.level is not null
      and (p.role = 'dp_lead' or (p.role = 'manager' and due.level = 'overdue'))
  ), ins as (
    insert into public.alerts (user_id, incident_id, deadline_id, level, message)
    select user_id, incident_id, deadline_id, level,
           left(format('%s: %s %s', code,
             case type when 'commissioner_72h' then 'Commissioner notice'
                       when 'subjects_7d'      then 'Notice to individuals'
                       else 'Follow-up information' end,
             case level when 'overdue' then 'is OVERDUE'
                        when 'warning' then 'is due in under 6 hours'
                        else 'is due in under 24 hours' end), 200)
    from who
    on conflict (deadline_id, user_id, level) do nothing
    returning 1
  )
  select count(*) into v_count from ins;
  return v_count;
end $$;

revoke all on function private.generate_alerts() from public, authenticated;

-- Schedule every 5 minutes where pg_cron exists (Supabase). Skipped in local tests.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('pdpa-deadline-alerts', '*/5 * * * *', 'select private.generate_alerts()');
  end if;
end $$;
