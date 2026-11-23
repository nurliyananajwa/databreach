-- Sprint 1 review: same rules, faster evaluation.
-- Wrapping auth.uid() in (select ...) makes Postgres run it once per query
-- instead of once per row. The meaning of each policy is unchanged.

alter policy profile_read on public.profiles
  using ((org_id = private.my_org()) and ((id = (select auth.uid())) or private.has_role(variadic array['dp_lead','manager'])));

alter policy task_read on public.tasks
  using ((private.incident_org(incident_id) = private.my_org()) and (private.has_role(variadic array['dp_lead','manager']) or (assignee_id = (select auth.uid()))));

alter policy alert_read on public.alerts
  using (user_id = (select auth.uid()));

alter policy alert_mark_read on public.alerts
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Indexes on foreign keys, so joins and deletes stay fast as data grows.
create index if not exists alerts_incident_id_idx              on public.alerts (incident_id);
create index if not exists assessments_assessed_by_idx         on public.assessments (assessed_by);
create index if not exists assessments_criterion_id_idx        on public.assessments (criterion_id);
create index if not exists data_set_versions_changed_by_idx    on public.data_set_versions (changed_by);
create index if not exists data_sets_owner_id_idx              on public.data_sets (owner_id);
create index if not exists decisions_decided_by_idx            on public.decisions (decided_by);
create index if not exists exposed_fields_confirmed_by_idx     on public.exposed_fields (confirmed_by);
create index if not exists exposed_fields_data_field_id_idx    on public.exposed_fields (data_field_id);
create index if not exists incident_data_sets_data_set_id_idx  on public.incident_data_sets (data_set_id);
create index if not exists invitations_invited_by_idx          on public.invitations (invited_by);
create index if not exists invitations_org_id_idx              on public.invitations (org_id);
create index if not exists notifications_approved_by_idx       on public.notifications (approved_by);
create index if not exists notifications_created_by_idx        on public.notifications (created_by);
create index if not exists notifications_sent_by_idx           on public.notifications (sent_by);
create index if not exists tasks_created_by_idx                on public.tasks (created_by);
