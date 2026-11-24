-- Sprint 3: every incident has a type, so reports can be grouped "by type and
-- status" (the supervisor's request). Staff pick it when they report a breach;
-- the Compliance Officer can correct it later.

alter table public.incidents
  add column incident_type varchar(24) not null default 'other'
  check (incident_type in ('unauthorised_access', 'lost_stolen', 'wrong_recipient',
                           'accidental_disclosure', 'malware', 'insider_misuse', 'other'));

-- report_incident gains the type as its last argument (default "other", so
-- older callers keep working). Same checks as before, plus the type.
drop function public.report_incident(text, text, timestamptz, uuid[]);

create function public.report_incident(p_title text, p_description text, p_aware_at timestamptz,
                                       p_data_sets uuid[] default '{}', p_type text default 'other')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_id uuid; v_code text; v_n int;
begin
  perform private.require_role('staff','dp_lead','manager');
  v_org := private.my_org();
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = '' then
    raise exception 'Title and description are required' using errcode = '22023';
  end if;
  if p_aware_at is null or p_aware_at > now() then
    raise exception 'Awareness time is required and cannot be in the future' using errcode = '22023';
  end if;
  if coalesce(p_type, '') not in ('unauthorised_access', 'lost_stolen', 'wrong_recipient',
                                  'accidental_disclosure', 'malware', 'insider_misuse', 'other') then
    raise exception 'Choose what kind of breach it is' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(coalesce(p_data_sets, '{}')) s(id)
             where not exists (select 1 from public.data_sets d
                               where d.id = s.id and d.org_id = v_org and d.status = 'active')) then
    raise exception 'Unknown data set' using errcode = '22023';
  end if;

  -- per-organisation running code: INC-001, INC-002 ...
  perform pg_advisory_xact_lock(hashtext('incident_code:' || v_org::text));
  select coalesce(max(substring(code from '^INC-(\d+)$')::int), 0) + 1 into v_n
  from public.incidents where org_id = v_org;
  v_code := 'INC-' || lpad(v_n::text, 3, '0');

  insert into public.incidents (org_id, code, title, description_enc, reported_by, aware_at, incident_type)
  values (v_org, v_code, left(trim(p_title), 160), private.encrypt(p_description), auth.uid(), p_aware_at, p_type)
  returning id into v_id;

  insert into public.incident_data_sets (incident_id, data_set_id)
  select v_id, x from (select distinct unnest(coalesce(p_data_sets, '{}')) as x) s;

  return v_id;
end $$;

-- The Compliance Officer corrects the type (not after the incident is closed).
create function public.set_incident_type(p_incident uuid, p_type text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.incident_for_lead(p_incident);
  if coalesce(p_type, '') not in ('unauthorised_access', 'lost_stolen', 'wrong_recipient',
                                  'accidental_disclosure', 'malware', 'insider_misuse', 'other') then
    raise exception 'Choose what kind of breach it is' using errcode = '22023';
  end if;
  update public.incidents set incident_type = p_type where id = p_incident;
end $$;

revoke all on function public.report_incident(text, text, timestamptz, uuid[], text) from public, anon;
revoke all on function public.set_incident_type(uuid, text) from public, anon;
grant execute on function public.report_incident(text, text, timestamptz, uuid[], text) to authenticated;
grant execute on function public.set_incident_type(uuid, text) to authenticated;
