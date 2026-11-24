-- Sprint 2: saving a data set from the Inventory page.
--
-- save_data_set writes the data set AND its field list in ONE transaction, so
-- one press of "Save changes" makes exactly one new version (the version
-- triggers from migration 03 count one version per transaction). A save that
-- changes nothing makes no version at all.
--
-- Both functions run as the caller (security invoker): the existing RLS
-- policies still decide who may write (Compliance Officer only) and the
-- checks below only add clear error messages and input rules.

create function public.save_data_set(
  p_id               uuid,      -- null = new data set
  p_name             text,
  p_storage_location text,
  p_access           text,
  p_purpose          text,
  p_retention        text,
  p_owner            uuid,
  p_processor        text,
  p_records          integer,
  p_fields           jsonb      -- [{ "id": uuid|null, "name": text, "category": text, "sensitive": bool }]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_org     uuid := private.my_org();
  v_id      uuid := p_id;
  v_n       int;
  v_name    text := btrim(coalesce(p_name, ''));
  v_store   text := btrim(coalesce(p_storage_location, ''));
  v_purpose text := btrim(coalesce(p_purpose, ''));
  v_access  text := nullif(btrim(coalesce(p_access, '')), '');
  v_retain  text := nullif(btrim(coalesce(p_retention, '')), '');
  v_proc    text := nullif(btrim(coalesce(p_processor, '')), '');
  v_fields  jsonb := coalesce(p_fields, '[]'::jsonb);
  v_old     public.data_sets;
  v_same    boolean;
begin
  if not private.has_role('dp_lead') then
    raise exception 'Only the Compliance Officer can change the inventory' using errcode = '42501';
  end if;

  -- details
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Name must be 2 to 120 characters' using errcode = '22023';
  end if;
  if v_store = '' or char_length(v_store) > 200 then
    raise exception 'Storage location is required (up to 200 characters)' using errcode = '22023';
  end if;
  if v_purpose = '' then
    raise exception 'Purpose is required' using errcode = '22023';
  end if;
  if char_length(coalesce(v_retain, '')) > 120 or char_length(coalesce(v_proc, '')) > 120 then
    raise exception 'Retention period and processor are up to 120 characters' using errcode = '22023';
  end if;
  if p_records is not null and p_records < 0 then
    raise exception 'Number of records cannot be negative' using errcode = '22023';
  end if;
  if p_owner is not null and not exists (select 1 from public.profiles p
       where p.id = p_owner and p.org_id = v_org and p.is_active) then
    raise exception 'The owner must be an active person in your organisation' using errcode = '22023';
  end if;

  -- fields: names only, never values
  if jsonb_typeof(v_fields) <> 'array' or jsonb_array_length(v_fields) > 100 then
    raise exception 'Fields must be a list of up to 100 items' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(v_fields) f
             where char_length(btrim(coalesce(f->>'name', ''))) not between 1 and 80
                or coalesce(f->>'category', '') not in ('identity','contact','financial','sensitive','other')) then
    raise exception 'Each field needs a name (up to 80 characters) and a category' using errcode = '22023';
  end if;
  -- a field NAME such as "Phone number" is fine; something that looks like a real
  -- value (an IC or phone number, an email address) is refused
  if exists (select 1 from jsonb_array_elements(v_fields) f
             where (f->>'name') ~ '\d{6,}|\d{3,}[- ]\d{3,}|[^ @]+@[^ @]+\.[a-z]') then
    raise exception 'A field name looks like real personal data. Enter the name of the field only, such as "Phone number".' using errcode = '22023';
  end if;
  if (select count(distinct lower(btrim(f->>'name'))) from jsonb_array_elements(v_fields) f) <> jsonb_array_length(v_fields) then
    raise exception 'Two fields have the same name' using errcode = '22023';
  end if;

  if v_id is null then
    -- per-organisation running code: DS-001, DS-002 ...
    perform pg_advisory_xact_lock(hashtext('data_set_code:' || v_org::text));
    select coalesce(max(substring(code from '^DS-(\d+)$')::int), 0) + 1 into v_n
    from public.data_sets where org_id = v_org;
    insert into public.data_sets (org_id, code, name, storage_location, access_description, purpose,
                                  retention_period, owner_id, processor_name, approx_records)
    values (v_org, 'DS-' || lpad(v_n::text, 3, '0'), v_name, v_store, v_access, v_purpose,
            v_retain, p_owner, v_proc, p_records)
    returning id into v_id;
  else
    select * into v_old from public.data_sets where id = v_id and org_id = v_org for update;
    if not found then
      raise exception 'Data set not found' using errcode = 'P0002';
    end if;
    if v_old.status = 'archived' then
      raise exception 'Restore the data set before editing it' using errcode = '22023';
    end if;
    -- unknown field ids would otherwise be silently ignored
    if exists (select 1 from jsonb_array_elements(v_fields) f
               where f ? 'id' and f->>'id' is not null
                 and not exists (select 1 from public.data_fields d
                                 where d.id = (f->>'id')::uuid and d.data_set_id = v_id)) then
      raise exception 'A field does not belong to this data set' using errcode = '22023';
    end if;

    -- nothing changed: no new version
    v_same := v_old.name = v_name and v_old.storage_location = v_store
      and v_old.access_description is not distinct from v_access and v_old.purpose = v_purpose
      and v_old.retention_period is not distinct from v_retain and v_old.owner_id is not distinct from p_owner
      and v_old.processor_name is not distinct from v_proc and v_old.approx_records is not distinct from p_records
      and (select coalesce(jsonb_agg(jsonb_build_array(d.id, d.field_name, d.category, d.is_sensitive) order by d.id), '[]')
           from public.data_fields d where d.data_set_id = v_id)
        = (select coalesce(jsonb_agg(jsonb_build_array((f->>'id')::uuid, btrim(f->>'name'), f->>'category',
                                     f->>'category' = 'sensitive' or coalesce((f->>'sensitive')::boolean, false))
                                     order by (f->>'id')::uuid), '[]')
           from jsonb_array_elements(v_fields) f);
    if v_same then
      return v_id;
    end if;

    update public.data_sets set name = v_name, storage_location = v_store, access_description = v_access,
      purpose = v_purpose, retention_period = v_retain, owner_id = p_owner, processor_name = v_proc,
      approx_records = p_records
    where id = v_id;

    -- removed fields go; exposure records keep their own copy of the name
    delete from public.data_fields d
    where d.data_set_id = v_id
      and d.id not in (select (f->>'id')::uuid from jsonb_array_elements(v_fields) f where f->>'id' is not null);

    -- renames last-to-first would clash with the unique name, so park changed names first
    update public.data_fields d set field_name = '~' || d.id::text
    from jsonb_array_elements(v_fields) f
    where f->>'id' is not null and d.id = (f->>'id')::uuid and d.field_name <> btrim(f->>'name');

    update public.data_fields d set field_name = btrim(f->>'name'), category = f->>'category',
      is_sensitive = f->>'category' = 'sensitive' or coalesce((f->>'sensitive')::boolean, false)
    from jsonb_array_elements(v_fields) f
    where f->>'id' is not null and d.id = (f->>'id')::uuid;
  end if;

  insert into public.data_fields (data_set_id, field_name, category, is_sensitive)
  select v_id, btrim(f->>'name'), f->>'category',
         f->>'category' = 'sensitive' or coalesce((f->>'sensitive')::boolean, false)
  from jsonb_array_elements(v_fields) f
  where f->>'id' is null;

  return v_id;
end $$;

-- Archive (hide from new reports, keep for history) or restore a data set.
create function public.set_data_set_status(p_id uuid, p_archived boolean) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not private.has_role('dp_lead') then
    raise exception 'Only the Compliance Officer can change the inventory' using errcode = '42501';
  end if;
  update public.data_sets set status = case when p_archived then 'archived' else 'active' end
  where id = p_id and org_id = private.my_org()
    and status <> case when p_archived then 'archived' else 'active' end;
  if not found and not exists (select 1 from public.data_sets where id = p_id and org_id = private.my_org()) then
    raise exception 'Data set not found' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.save_data_set(uuid, text, text, text, text, text, uuid, text, integer, jsonb) from public, anon;
revoke all on function public.set_data_set_status(uuid, boolean) from public, anon;
grant execute on function public.save_data_set(uuid, text, text, text, text, text, uuid, text, integer, jsonb) to authenticated;
grant execute on function public.set_data_set_status(uuid, boolean) to authenticated;
