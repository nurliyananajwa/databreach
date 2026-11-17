-- Row-level security. Rules follow proposal Table 23.
-- Helper functions live in the `private` schema, which the API cannot call directly.

-- ---------------------------------------------------------------- helpers
create function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p
  where p.id = auth.uid() and p.is_active
$$;

create function private.my_org() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.org_id from public.profiles p
  where p.id = auth.uid() and p.is_active
$$;

create function private.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = any(roles), false)
$$;

create function private.incident_org(p_incident uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select org_id from public.incidents where id = p_incident
$$;

create function private.data_set_org(p_data_set uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select org_id from public.data_sets where id = p_data_set
$$;

-- lead/manager of the same org, or the staff member who reported it
create function private.can_see_incident(p_incident uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.incidents i
    where i.id = p_incident
      and i.org_id = private.my_org()
      and (private.has_role('dp_lead','manager') or i.reported_by = auth.uid())
  )
$$;

create function private.is_lead_or_manager_of(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_org = private.my_org() and private.has_role('dp_lead','manager')
$$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function
  private.my_role(), private.my_org(), private.has_role(text[]),
  private.incident_org(uuid), private.data_set_org(uuid),
  private.can_see_incident(uuid), private.is_lead_or_manager_of(uuid)
to authenticated;

-- ---------------------------------------------------------------- grants
-- Nothing for anonymous visitors. Signed-in users get SELECT, plus a few
-- column-limited writes. Everything else goes through RPCs (migration 4).
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;

grant insert (org_id, code, name, storage_location, access_description, purpose,
              retention_period, owner_id, processor_name, approx_records)
  on public.data_sets to authenticated;
grant update (name, storage_location, access_description, purpose, retention_period,
              owner_id, processor_name, approx_records, status)
  on public.data_sets to authenticated;

grant insert (data_set_id, field_name, category, is_sensitive) on public.data_fields to authenticated;
grant update (field_name, category, is_sensitive)              on public.data_fields to authenticated;
grant delete                                                   on public.data_fields to authenticated;

grant insert (incident_id, data_set_id) on public.incident_data_sets to authenticated;
grant delete                            on public.incident_data_sets to authenticated;

grant insert (incident_id, title, assignee_id, due_at) on public.tasks to authenticated;
grant update (title, assignee_id, due_at)              on public.tasks to authenticated;

grant update (read_at) on public.alerts to authenticated;

-- ---------------------------------------------------------------- enable RLS
do $$
declare t text;
begin
  foreach t in array array['organisations','profiles','invitations','data_sets','data_set_versions',
    'data_fields','incidents','incident_data_sets','exposed_fields','criteria','assessments',
    'decisions','deadlines','tasks','notifications','alerts','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- policies
create policy org_read on public.organisations for select to authenticated
  using (id = private.my_org());

create policy profile_read on public.profiles for select to authenticated
  using (org_id = private.my_org()
         and (id = auth.uid() or private.has_role('dp_lead','manager')));

create policy invitation_read on public.invitations for select to authenticated
  using (org_id = private.my_org() and private.has_role('manager'));

-- inventory: lead writes, lead + manager read, staff nothing
create policy ds_read on public.data_sets for select to authenticated
  using (private.is_lead_or_manager_of(org_id));
create policy ds_insert on public.data_sets for insert to authenticated
  with check (org_id = private.my_org() and private.has_role('dp_lead')
              and (owner_id is null or exists (select 1 from public.profiles p
                   where p.id = owner_id and p.org_id = private.my_org())));
create policy ds_update on public.data_sets for update to authenticated
  using (org_id = private.my_org() and private.has_role('dp_lead'))
  with check (org_id = private.my_org() and private.has_role('dp_lead')
              and (owner_id is null or exists (select 1 from public.profiles p
                   where p.id = owner_id and p.org_id = private.my_org())));

create policy dsv_read on public.data_set_versions for select to authenticated
  using (private.is_lead_or_manager_of(private.data_set_org(data_set_id)));

create policy df_read on public.data_fields for select to authenticated
  using (private.is_lead_or_manager_of(private.data_set_org(data_set_id)));
create policy df_insert on public.data_fields for insert to authenticated
  with check (private.data_set_org(data_set_id) = private.my_org() and private.has_role('dp_lead'));
create policy df_update on public.data_fields for update to authenticated
  using (private.data_set_org(data_set_id) = private.my_org() and private.has_role('dp_lead'))
  with check (private.data_set_org(data_set_id) = private.my_org() and private.has_role('dp_lead'));
create policy df_delete on public.data_fields for delete to authenticated
  using (private.data_set_org(data_set_id) = private.my_org() and private.has_role('dp_lead'));

-- incidents: written only through RPCs (the description must be encrypted)
create policy inc_read on public.incidents for select to authenticated
  using (private.can_see_incident(id));

create policy ids_read on public.incident_data_sets for select to authenticated
  using (private.can_see_incident(incident_id));
create function private.incident_is_open(p_incident uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.incidents where id = p_incident and status <> 'closed')
$$;
grant execute on function private.incident_is_open(uuid) to authenticated;

create policy ids_insert on public.incident_data_sets for insert to authenticated
  with check (private.incident_org(incident_id) = private.my_org()
              and private.data_set_org(data_set_id) = private.my_org()
              and private.has_role('dp_lead') and private.incident_is_open(incident_id));
create policy ids_delete on public.incident_data_sets for delete to authenticated
  using (private.incident_org(incident_id) = private.my_org() and private.has_role('dp_lead')
         and private.incident_is_open(incident_id));

create policy ef_read on public.exposed_fields for select to authenticated
  using (private.is_lead_or_manager_of(private.incident_org(incident_id)));
create policy cr_read on public.criteria for select to authenticated using (true);
create policy as_read on public.assessments for select to authenticated
  using (private.is_lead_or_manager_of(private.incident_org(incident_id)));
create policy dec_read on public.decisions for select to authenticated
  using (private.is_lead_or_manager_of(private.incident_org(incident_id)));
create policy dl_read on public.deadlines for select to authenticated
  using (private.is_lead_or_manager_of(private.incident_org(incident_id)));

create policy task_read on public.tasks for select to authenticated
  using (private.incident_org(incident_id) = private.my_org()
         and (private.has_role('dp_lead','manager') or assignee_id = auth.uid()));
create policy task_insert on public.tasks for insert to authenticated
  with check (private.incident_org(incident_id) = private.my_org() and private.has_role('dp_lead'));
create policy task_update on public.tasks for update to authenticated
  using (private.incident_org(incident_id) = private.my_org() and private.has_role('dp_lead'))
  with check (private.incident_org(incident_id) = private.my_org() and private.has_role('dp_lead'));

create policy notif_read on public.notifications for select to authenticated
  using (private.is_lead_or_manager_of(private.incident_org(incident_id)));

create policy alert_read on public.alerts for select to authenticated
  using (user_id = auth.uid());
create policy alert_mark_read on public.alerts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_read on public.audit_log for select to authenticated
  using (org_id = private.my_org() and private.has_role('manager'));
