-- Integrity rules (append-only tables, retention lock, forward-only status,
-- inventory versioning) and the audit trail.
-- These triggers apply to EVERY role, including the service role.

-- Malaysia time helper
create function private.kl_date(ts timestamptz) returns date
language sql immutable set search_path = '' as $$
  select (ts at time zone 'Asia/Kuala_Lumpur')::date
$$;

-- ---------------------------------------------------------------- append-only
create function private.block_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only: % is not allowed', tg_table_name, lower(tg_op)
    using errcode = 'P0001';
end $$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.block_change();
create trigger dsv_append_only before update or delete on public.data_set_versions
  for each row execute function private.block_change();
create trigger decisions_no_update before update on public.decisions
  for each row execute function private.block_change();
create trigger assessments_no_update before update on public.assessments
  for each row execute function private.block_change();

-- Decisions and assessments may only disappear together with their incident
-- (i.e. when a closed incident is removed after its 2-year retention date).
create function private.only_with_incident() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.incidents where id = old.incident_id) then
    raise exception '% is append-only: delete is not allowed', tg_table_name using errcode = 'P0001';
  end if;
  return old;
end $$;

create trigger decisions_no_delete before delete on public.decisions
  for each row execute function private.only_with_incident();
create trigger assessments_no_delete before delete on public.assessments
  for each row execute function private.only_with_incident();

-- Data sets are archived, never deleted. Users are deactivated, never deleted.
create trigger data_sets_no_delete before delete on public.data_sets
  for each row execute function private.block_change();
create trigger profiles_no_delete before delete on public.profiles
  for each row execute function private.block_change();

-- ---------------------------------------------------------------- incidents
create function private.status_rank(s text) returns int
language sql immutable set search_path = '' as $$
  select array_position(array['reported','assessing','decided','notified','follow_up','closed'], s)
$$;

create function private.incident_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.status_rank(new.status) < private.status_rank(old.status) then
    raise exception 'Incident status can only move forward (% -> %)', old.status, new.status
      using errcode = 'P0001';
  end if;

  if new.aware_at is distinct from old.aware_at
     and private.status_rank(old.status) >= private.status_rank('decided') then
    raise exception 'Awareness time is locked once a decision is recorded' using errcode = 'P0001';
  end if;

  if new.org_id <> old.org_id or new.reported_by <> old.reported_by
     or new.reported_at <> old.reported_at or new.code <> old.code then
    raise exception 'Organisation, reporter, report time and code cannot change' using errcode = 'P0001';
  end if;

  if old.closed_at is not null and new.closed_at is distinct from old.closed_at then
    raise exception 'A closed incident cannot be reopened or re-dated' using errcode = 'P0001';
  end if;

  -- retention date is always derived, never typed
  new.retain_until := case when new.closed_at is null then null
                           else private.kl_date(new.closed_at) + interval '2 years' end;
  return new;
end $$;

create trigger incident_guard before update on public.incidents
  for each row execute function private.incident_guard();

create function private.incident_retention_lock() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.closed_at is null then
    raise exception 'Open incidents cannot be deleted' using errcode = 'P0001';
  end if;
  if old.retain_until > private.kl_date(now()) then
    raise exception 'Register entry is kept until %; it cannot be deleted before then', old.retain_until
      using errcode = 'P0001';
  end if;
  -- lets the audit trigger find the org while child rows cascade away
  perform set_config('pdpa.deleting_org', old.org_id::text, true);
  return old;
end $$;

create trigger incident_retention_lock before delete on public.incidents
  for each row execute function private.incident_retention_lock();

-- ---------------------------------------------------------------- same-org checks
create function private.task_same_org() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.assignee_id is not null and not exists (
       select 1 from public.profiles p join public.incidents i on i.org_id = p.org_id
       where p.id = new.assignee_id and i.id = new.incident_id and p.is_active) then
    raise exception 'Assignee must be an active user of the same organisation' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  return new;
end $$;

create trigger task_same_org before insert or update on public.tasks
  for each row execute function private.task_same_org();

-- ---------------------------------------------------------------- inventory versions
-- One version per saved change (one transaction), however many fields changed.
create function private.ds_flag(p_id uuid) returns text
language sql immutable set search_path = '' as $$
  select 'pdpa.ds_' || replace(p_id::text, '-', '')
$$;

create function private.ds_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.org_id <> old.org_id or new.code <> old.code then
      raise exception 'Organisation and code of a data set cannot change' using errcode = 'P0001';
    end if;
    if coalesce(current_setting(private.ds_flag(new.id), true), '') <> '1' then
      new.version_no := old.version_no + 1;
    else
      new.version_no := old.version_no;
    end if;
  else
    new.version_no := 1;
  end if;
  new.updated_at := now();
  perform set_config(private.ds_flag(new.id), '1', true);
  return new;
end $$;

create trigger ds_before_write before insert or update on public.data_sets
  for each row execute function private.ds_before_write();

create function private.df_touch_data_set() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_ds uuid := coalesce(new.data_set_id, old.data_set_id);
begin
  if tg_op = 'UPDATE' and new.data_set_id <> old.data_set_id then
    raise exception 'A field cannot move to another data set' using errcode = 'P0001';
  end if;
  if coalesce(current_setting(private.ds_flag(v_ds), true), '') <> '1' then
    update public.data_sets set updated_at = now() where id = v_ds;
  end if;
  return null;
end $$;

create trigger df_touch_data_set after insert or update or delete on public.data_fields
  for each row execute function private.df_touch_data_set();

-- Snapshot is written at COMMIT, so it holds the final state of the save.
create function private.ds_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.data_set_versions (data_set_id, version_no, snapshot, changed_by)
  select d.id, d.version_no,
         to_jsonb(d) || jsonb_build_object('fields', coalesce((
           select jsonb_agg(jsonb_build_object('field_name', f.field_name, 'category', f.category,
                                               'is_sensitive', f.is_sensitive) order by f.field_name)
           from public.data_fields f where f.data_set_id = d.id), '[]'::jsonb)),
         auth.uid()
  from public.data_sets d where d.id = new.id
  on conflict (data_set_id, version_no) do nothing;
  return null;
end $$;

create constraint trigger ds_snapshot after insert or update on public.data_sets
  deferrable initially deferred
  for each row execute function private.ds_snapshot();

-- ---------------------------------------------------------------- audit trail
create function private.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_org uuid;
  v_details jsonb;
  k text;
begin
  -- find the organisation of this row
  v_org := case
    when tg_table_name = 'organisations' then (v_row ->> 'id')::uuid
    when v_row ? 'org_id'               then (v_row ->> 'org_id')::uuid
    when v_row ? 'incident_id' then (select org_id from public.incidents where id = (v_row ->> 'incident_id')::uuid)
    when v_row ? 'data_set_id' then (select org_id from public.data_sets where id = (v_row ->> 'data_set_id')::uuid)
  end;
  v_org := coalesce(v_org, nullif(current_setting('pdpa.deleting_org', true), '')::uuid);
  if v_org is null then
    return null;  -- reference data with no owner (e.g. criteria)
  end if;

  -- never copy encrypted text into the log
  v_new := v_new - 'description_enc' - 'containment_enc';
  v_old := v_old - 'description_enc' - 'containment_enc';

  if tg_op = 'UPDATE' then
    v_details := jsonb_build_object('before', '{}'::jsonb, 'after', '{}'::jsonb);
    for k in select jsonb_object_keys(v_new) loop
      if v_new -> k is distinct from v_old -> k then
        v_details := jsonb_set(v_details, array['before', k], coalesce(v_old -> k, 'null'));
        v_details := jsonb_set(v_details, array['after', k],  coalesce(v_new -> k, 'null'));
      end if;
    end loop;
    if v_details -> 'after' = '{}'::jsonb then
      return null;  -- nothing visible changed
    end if;
  elsif tg_op = 'INSERT' then
    v_details := jsonb_build_object('after', v_new);
  else
    v_details := jsonb_build_object('before', v_old);
  end if;

  insert into public.audit_log (org_id, actor_id, table_name, record_id, action, details)
  values (v_org, auth.uid(), tg_table_name, (v_row ->> 'id')::uuid, lower(tg_op), v_details);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['organisations','profiles','invitations','data_sets','data_fields',
    'incidents','incident_data_sets','exposed_fields','assessments','decisions','deadlines',
    'tasks','notifications']
  loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function private.audit_row()', t);
  end loop;
end $$;
