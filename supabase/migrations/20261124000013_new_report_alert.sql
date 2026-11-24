-- Sprint 3: "The Compliance Officer is told straight away."
-- A new incident sends an alert to every active Compliance Officer in the
-- organisation (except the person who reported it). The bell and the live
-- updates already show new alerts, so nothing else is needed.

create function private.alert_new_incident() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.alerts (user_id, incident_id, level, message)
  select p.id, new.id, 'info', left(format('%s reported: %s', new.code, new.title), 200)
  from public.profiles p
  where p.org_id = new.org_id and p.role = 'dp_lead' and p.is_active and p.id <> new.reported_by;
  return new;
end $$;

revoke all on function private.alert_new_incident() from public, anon, authenticated;

create trigger incidents_alert_new after insert on public.incidents
  for each row execute function private.alert_new_incident();
