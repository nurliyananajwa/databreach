-- Actions the app calls (security-definer RPCs). Each one checks the caller's
-- role and organisation itself, then writes. Users cannot write these tables directly.

-- small guard used by every RPC
create function private.require_role(variadic roles text[]) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not private.has_role(variadic roles) then
    raise exception 'Not allowed for your role' using errcode = '42501';
  end if;
end $$;

create function private.incident_for_lead(p_incident uuid, p_allow_closed boolean default false)
returns public.incidents
language plpgsql security definer set search_path = '' as $$
declare i public.incidents;
begin
  perform private.require_role('dp_lead');
  select * into i from public.incidents where id = p_incident and org_id = private.my_org() for update;
  if not found then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;
  if i.status = 'closed' and not p_allow_closed then
    raise exception 'Incident is closed' using errcode = 'P0001';
  end if;
  return i;
end $$;

-- ================================================================ users
-- Called by the app right after Google sign-in.
create function public.claim_invitation() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_user auth.users;
  v_inv public.invitations;
  v_prof public.profiles;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_prof from public.profiles where id = v_uid;
  if found then
    if not v_prof.is_active then
      raise exception 'This account has been deactivated' using errcode = '42501';
    end if;
    return v_prof;
  end if;

  select * into v_user from auth.users where id = v_uid;
  select * into v_inv from public.invitations
   where email = lower(v_user.email) and accepted_at is null and revoked_at is null
   for update;
  if not found then
    raise exception 'not_invited' using errcode = '42501',
      hint = 'Ask your manager to invite this Google account.';
  end if;

  insert into public.profiles (id, org_id, full_name, email, role)
  values (v_uid, v_inv.org_id,
          left(coalesce(v_user.raw_user_meta_data ->> 'full_name',
                        v_user.raw_user_meta_data ->> 'name',
                        split_part(v_user.email, '@', 1)), 100),
          lower(v_user.email), v_inv.role)
  returning * into v_prof;

  update public.invitations set accepted_at = now() where id = v_inv.id;
  return v_prof;
end $$;

create function public.invite_user(p_email text, p_role text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_email text := lower(trim(p_email));
begin
  perform private.require_role('manager');
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;
  if p_role not in ('staff','dp_lead','manager') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where email = v_email) then
    raise exception 'This person already has an account' using errcode = '23505';
  end if;
  insert into public.invitations (org_id, email, role, invited_by)
  values (private.my_org(), v_email, p_role, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create function public.revoke_invitation(p_invitation uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_role('manager');
  update public.invitations set revoked_at = now()
   where id = p_invitation and org_id = private.my_org()
     and accepted_at is null and revoked_at is null;
  if not found then
    raise exception 'Open invitation not found' using errcode = 'P0002';
  end if;
end $$;

create function public.set_user_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_role('manager');
  if p_user = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;
  if p_role not in ('staff','dp_lead','manager') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  update public.profiles set role = p_role where id = p_user and org_id = private.my_org();
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end $$;

create function public.set_user_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_role('manager');
  if p_user = auth.uid() then
    raise exception 'You cannot deactivate yourself' using errcode = '42501';
  end if;
  update public.profiles set is_active = p_active where id = p_user and org_id = private.my_org();
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end $$;

-- ================================================================ reporting
-- Staff cannot read the inventory, but may pick data set NAMES when reporting.
create function public.list_data_set_names() returns table (id uuid, name text)
language sql stable security definer set search_path = '' as $$
  select d.id, d.name::text from public.data_sets d
  where d.org_id = private.my_org() and d.status = 'active' and private.my_role() is not null
  order by d.name
$$;

create function public.report_incident(p_title text, p_description text, p_aware_at timestamptz,
                                       p_data_sets uuid[] default '{}')
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

  insert into public.incidents (org_id, code, title, description_enc, reported_by, aware_at)
  values (v_org, v_code, left(trim(p_title), 160), private.encrypt(p_description), auth.uid(), p_aware_at)
  returning id into v_id;

  insert into public.incident_data_sets (incident_id, data_set_id)
  select v_id, x from (select distinct unnest(coalesce(p_data_sets, '{}')) as x) s;

  return v_id;
end $$;

-- Decrypted text for someone allowed to see the incident.
create function public.get_incident_text(p_incident uuid)
returns table (description text, containment text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_see_incident(p_incident) then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;
  return query
    select private.decrypt(i.description_enc), private.decrypt(i.containment_enc)
    from public.incidents i where i.id = p_incident;
end $$;

create function public.update_incident_text(p_incident uuid, p_description text default null,
                                            p_containment text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.incident_for_lead(p_incident);
  update public.incidents set
    description_enc = coalesce(private.encrypt(nullif(trim(p_description), '')), description_enc),
    containment_enc = coalesce(private.encrypt(nullif(trim(p_containment), '')), containment_enc)
  where id = p_incident;
end $$;

-- Lead may correct the awareness time before a decision is made (trigger enforces the lock).
create function public.set_awareness_time(p_incident uuid, p_aware_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.incidents;
begin
  i := private.incident_for_lead(p_incident);
  if p_aware_at > i.reported_at then
    raise exception 'Awareness time cannot be after the report time' using errcode = '22023';
  end if;
  update public.incidents set aware_at = p_aware_at where id = p_incident;
end $$;

-- ================================================================ assessment
create function public.confirm_exposure(p_incident uuid, p_fields uuid[], p_individuals int)
returns void
language plpgsql security definer set search_path = '' as $$
declare i public.incidents;
begin
  i := private.incident_for_lead(p_incident);
  if p_individuals is null or p_individuals < 0 then
    raise exception 'Number of affected individuals is required' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_fields), 0) = 0 then
    raise exception 'Select at least one exposed field' using errcode = '22023';
  end if;
  -- only fields from data sets linked to this incident
  if exists (select 1 from unnest(p_fields) f(id)
             where not exists (select 1 from public.data_fields df
                               join public.incident_data_sets l on l.data_set_id = df.data_set_id
                               where df.id = f.id and l.incident_id = p_incident)) then
    raise exception 'A field does not belong to a data set linked to this incident' using errcode = '22023';
  end if;

  delete from public.exposed_fields where incident_id = p_incident;
  insert into public.exposed_fields (incident_id, data_field_id, field_name_snapshot,
                                     category_snapshot, sensitive_snapshot, confirmed_by)
  select p_incident, df.id, df.field_name, df.category, df.is_sensitive, auth.uid()
  from public.data_fields df where df.id = any(p_fields);

  update public.incidents
     set individuals_affected = p_individuals,
         status = case when status = 'reported' then 'assessing' else status end
   where id = p_incident;
end $$;

-- p_judgements: {"PHYSICAL_PROPERTY": {"answer": true, "reason": "..."}, "ILLEGAL_MISUSE": {...}}
create function public.run_assessment(p_incident uuid, p_judgements jsonb default '{}')
returns table (code text, result text, reason text)
language plpgsql security definer set search_path = '' as $$
declare
  i public.incidents;
  v_run int;
  c public.criteria;
  v_result text; v_reason text; v_input jsonb; v_by uuid;
  v_sens boolean; v_fin boolean; v_ident boolean; v_contact boolean;
  j jsonb;
begin
  i := private.incident_for_lead(p_incident);
  if i.individuals_affected is null or not exists (select 1 from public.exposed_fields where incident_id = p_incident) then
    raise exception 'Confirm the exposed fields and number of individuals first' using errcode = 'P0001';
  end if;

  select bool_or(sensitive_snapshot), bool_or(category_snapshot = 'financial'),
         bool_or(category_snapshot = 'identity'), bool_or(category_snapshot = 'contact')
    into v_sens, v_fin, v_ident, v_contact
  from public.exposed_fields where incident_id = p_incident;

  select coalesce(max(run_no), 0) + 1 into v_run from public.assessments where incident_id = p_incident;

  for c in select * from public.criteria where guideline_version = private.current_guideline() order by code loop
    v_by := null;
    case c.code
      when 'SCALE_1000' then
        v_input := jsonb_build_object('individuals_affected', i.individuals_affected);
        v_result := case when i.individuals_affected > 1000 then 'met' else 'not_met' end;
        v_reason := format('%s individuals affected; the threshold is more than 1,000.', i.individuals_affected);
      when 'SENSITIVE_DATA' then
        v_input := jsonb_build_object('sensitive_fields', (select coalesce(jsonb_agg(field_name_snapshot), '[]')
                     from public.exposed_fields where incident_id = p_incident and sensitive_snapshot));
        v_result := case when v_sens then 'met' else 'not_met' end;
        v_reason := case when v_sens then 'Sensitive personal data was exposed.'
                         else 'No exposed field is marked sensitive.' end;
      when 'FINANCIAL_LOSS' then
        v_input := jsonb_build_object('financial_fields', (select coalesce(jsonb_agg(field_name_snapshot), '[]')
                     from public.exposed_fields where incident_id = p_incident and category_snapshot = 'financial'));
        v_result := case when v_fin then 'met' else 'not_met' end;
        v_reason := case when v_fin then 'Financial data was exposed.'
                         else 'No financial field was exposed.' end;
      when 'IDENTITY_FRAUD' then
        v_input := jsonb_build_object('identity', coalesce(v_ident, false),
                                      'contact', coalesce(v_contact, false), 'financial', coalesce(v_fin, false));
        v_result := case when v_ident and (v_contact or v_fin) then 'met' else 'not_met' end;
        v_reason := case when v_result = 'met'
                         then 'An ID number was exposed together with contact or financial data.'
                         when v_ident then 'An ID number was exposed, but without contact or financial data.'
                         else 'No ID number was exposed.' end;
      else  -- judgement criteria
        j := p_judgements -> c.code;
        v_input := j;
        if j is null or jsonb_typeof(j -> 'answer') <> 'boolean' then
          v_result := 'needs_judgement';
          v_reason := 'The data protection lead must answer this question.';
        elsif length(trim(coalesce(j ->> 'reason', ''))) < 10 then
          raise exception 'Give a reason (at least 10 characters) for %', c.code using errcode = '22023';
        else
          v_result := case when (j ->> 'answer')::boolean then 'met' else 'not_met' end;
          v_reason := trim(j ->> 'reason');
          v_by := auth.uid();
        end if;
    end case;

    insert into public.assessments (incident_id, run_no, criterion_id, result, input_used, reason, assessed_by)
    values (p_incident, v_run, c.id, v_result, v_input, v_reason, v_by);
    code := c.code; result := v_result; reason := v_reason;
    return next;
  end loop;
end $$;

-- What the rules suggest, from the latest assessment run.
create function public.suggested_decision(p_incident uuid)
returns table (assessment_run int, notify_commissioner boolean, notify_subjects boolean, pending_judgements int)
language sql stable security definer set search_path = '' as $$
  with last as (
    select max(run_no) as run from public.assessments a
    where a.incident_id = p_incident and private.is_lead_or_manager_of(private.incident_org(p_incident))
  ), r as (
    select c.kind, a.result from public.assessments a
    join public.criteria c on c.id = a.criterion_id
    join last on a.run_no = last.run
    where a.incident_id = p_incident
  )
  select (select run from last),
         coalesce(bool_or(result = 'met'), false),
         coalesce(bool_or(kind = 'harm' and result = 'met'), false),
         count(*) filter (where result = 'needs_judgement')::int
  from r
  having (select run from last) is not null
$$;

create function public.record_decision(p_incident uuid, p_notify_commissioner boolean,
                                       p_notify_subjects boolean, p_reason text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare s record; v_id uuid;
begin
  perform private.incident_for_lead(p_incident);
  select * into s from public.suggested_decision(p_incident);
  if s.assessment_run is null then
    raise exception 'Run the assessment first' using errcode = 'P0001';
  end if;
  if s.pending_judgements > 0 then
    raise exception 'Answer every judgement question before deciding' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception 'A reason of at least 10 characters is required' using errcode = '22023';
  end if;

  insert into public.decisions (incident_id, assessment_run, suggested_commissioner, suggested_subjects,
                                notify_commissioner, notify_subjects, reason, decided_by)
  values (p_incident, s.assessment_run, s.notify_commissioner, s.notify_subjects,
          p_notify_commissioner, p_notify_subjects, trim(p_reason), auth.uid())
  returning id into v_id;

  update public.incidents set status = 'decided'
   where id = p_incident and private.status_rank(status) < private.status_rank('decided');
  return v_id;
end $$;

-- ================================================================ notifications
create function private.latest_decision(p_incident uuid) returns public.decisions
language sql stable security definer set search_path = '' as $$
  select * from public.decisions where incident_id = p_incident order by decided_at desc, id desc limit 1
$$;

-- Pre-fills the fields of the official DBN form from the record.
create function public.prefill_notification(p_incident uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare i public.incidents; v jsonb;
begin
  if not private.is_lead_or_manager_of(private.incident_org(p_incident)) then
    raise exception 'Incident not found' using errcode = 'P0002';
  end if;
  select * into i from public.incidents where id = p_incident;
  select jsonb_build_object(
    'organisation', (select name from public.organisations where id = i.org_id),
    'incident_code', i.code,
    'aware_at', i.aware_at,
    'reported_internally_at', i.reported_at,
    'personal_data_types', coalesce((select jsonb_agg(distinct field_name_snapshot)
                              from public.exposed_fields where incident_id = i.id), '[]'),
    'contains_sensitive_data', coalesce((select bool_or(sensitive_snapshot)
                              from public.exposed_fields where incident_id = i.id), false),
    'individuals_affected', i.individuals_affected,
    'systems_affected', coalesce((select jsonb_agg(d.name || ' (' || d.storage_location || ')')
                              from public.incident_data_sets l join public.data_sets d on d.id = l.data_set_id
                              where l.incident_id = i.id), '[]'),
    'description', private.decrypt(i.description_enc),
    'containment_measures', private.decrypt(i.containment_enc),
    'delay_reason', i.delay_reason
  ) into v;
  return v;
end $$;

create function public.save_notification_draft(p_incident uuid, p_recipient text, p_draft jsonb,
                                               p_notification uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare d public.decisions; v_id uuid;
begin
  perform private.incident_for_lead(p_incident);
  d := private.latest_decision(p_incident);
  if d.id is null then
    raise exception 'Record a decision first' using errcode = 'P0001';
  end if;
  if p_recipient = 'commissioner' and not d.notify_commissioner
     or p_recipient = 'data_subjects' and not d.notify_subjects then
    raise exception 'The current decision does not require notifying %', p_recipient using errcode = 'P0001';
  end if;
  if p_recipient = 'commissioner_update' and not exists (select 1 from public.notifications
       where incident_id = p_incident and recipient = 'commissioner' and status = 'sent') then
    raise exception 'A follow-up needs the first Commissioner notification to be sent' using errcode = 'P0001';
  end if;

  if p_notification is null then
    insert into public.notifications (incident_id, recipient, draft, created_by)
    values (p_incident, p_recipient, coalesce(p_draft, '{}'), auth.uid())
    returning id into v_id;
  else
    update public.notifications set draft = coalesce(p_draft, '{}'), status = 'draft'
     where id = p_notification and incident_id = p_incident and recipient = p_recipient
       and status in ('draft','returned')
    returning id into v_id;
    if v_id is null then
      raise exception 'Only drafts or returned notifications can be edited' using errcode = 'P0001';
    end if;
  end if;
  return v_id;
end $$;

create function private.notification_for(p_notification uuid, p_from text[]) returns public.notifications
language plpgsql security definer set search_path = '' as $$
declare n public.notifications;
begin
  select * into n from public.notifications where id = p_notification for update;
  if not found or private.incident_org(n.incident_id) is distinct from private.my_org() then
    raise exception 'Notification not found' using errcode = 'P0002';
  end if;
  if not n.status = any(p_from) then
    raise exception 'Notification is %, expected one of %', n.status, p_from using errcode = 'P0001';
  end if;
  return n;
end $$;

create function public.submit_notification(p_notification uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_role('dp_lead');
  perform private.notification_for(p_notification, array['draft','returned']);
  update public.notifications set status = 'pending_approval', review_note = null where id = p_notification;
end $$;

-- Separation of duties: only a manager approves, and never their own draft.
create function public.approve_notification(p_notification uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare n public.notifications;
begin
  perform private.require_role('manager');
  n := private.notification_for(p_notification, array['pending_approval']);
  if n.created_by = auth.uid() then
    raise exception 'You cannot approve a draft you wrote' using errcode = '42501';
  end if;
  update public.notifications set status = 'approved', approved_by = auth.uid(), approved_at = now()
   where id = p_notification;
end $$;

create function public.return_notification(p_notification uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_role('manager');
  perform private.notification_for(p_notification, array['pending_approval']);
  if length(trim(coalesce(p_note, ''))) < 5 then
    raise exception 'Say what needs to change' using errcode = '22023';
  end if;
  update public.notifications set status = 'returned', review_note = trim(p_note) where id = p_notification;
end $$;

-- The business sends the notice itself; this only RECORDS that it was sent.
create function public.record_notification_sent(p_notification uuid, p_sent_at timestamptz, p_method text,
                                                p_reference text default null, p_delay_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare n public.notifications; i public.incidents; d public.decisions; v_all_sent boolean;
begin
  perform private.require_role('dp_lead');
  n := private.notification_for(p_notification, array['approved']);
  i := private.incident_for_lead(n.incident_id);
  if p_sent_at is null or p_sent_at > now() or p_sent_at < i.aware_at then
    raise exception 'Sent time must be between the awareness time and now' using errcode = '22023';
  end if;
  if coalesce(trim(p_method), '') = '' then
    raise exception 'Say how it was sent' using errcode = '22023';
  end if;

  -- Late Commissioner notice must say why (DBN Guideline: written reasons for delay).
  if n.recipient = 'commissioner' and p_sent_at > i.aware_at + interval '72 hours' then
    if length(trim(coalesce(p_delay_reason, i.delay_reason, ''))) < 10 then
      raise exception 'Sent after 72 hours: a reason for the delay is required' using errcode = '22023';
    end if;
    update public.incidents set delay_reason = coalesce(nullif(trim(p_delay_reason), ''), delay_reason)
     where id = i.id;
  end if;

  update public.notifications
     set status = 'sent', sent_at = p_sent_at, sent_by = auth.uid(),
         method = left(trim(p_method), 30), reference_no = left(nullif(trim(p_reference), ''), 40)
   where id = p_notification;

  d := private.latest_decision(i.id);
  select (not d.notify_commissioner or exists (select 1 from public.notifications
            where incident_id = i.id and recipient = 'commissioner' and status = 'sent'))
     and (not d.notify_subjects or exists (select 1 from public.notifications
            where incident_id = i.id and recipient = 'data_subjects' and status = 'sent'))
    into v_all_sent;

  update public.incidents set status =
    case when v_all_sent then 'follow_up' else 'notified' end
   where id = i.id
     and private.status_rank(status) < private.status_rank(case when v_all_sent then 'follow_up' else 'notified' end);
end $$;

create function public.mark_followup_done(p_incident uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.incident_for_lead(p_incident);
  update public.incidents set followup_done_at = now() where id = p_incident and followup_done_at is null;
end $$;

-- ================================================================ tasks and closing
create function public.complete_task(p_task uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare t public.tasks;
begin
  perform private.require_role('staff','dp_lead','manager');
  select * into t from public.tasks where id = p_task for update;
  if not found or private.incident_org(t.incident_id) is distinct from private.my_org()
     or not (t.assignee_id = auth.uid() or private.has_role('dp_lead')) then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  update public.tasks set completed_at = coalesce(completed_at, now()) where id = p_task;
end $$;

create function public.close_incident(p_incident uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.incidents;
begin
  i := private.incident_for_lead(p_incident);
  if (private.latest_decision(p_incident)).id is null then
    raise exception 'Record a decision before closing' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.tasks where incident_id = p_incident and completed_at is null) then
    raise exception 'Finish every task before closing' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.deadlines where incident_id = p_incident and status = 'open') then
    raise exception 'Every deadline must be met or not required before closing' using errcode = 'P0001';
  end if;
  update public.incidents set status = 'closed', closed_at = now() where id = p_incident;
end $$;

-- ================================================================ permissions
revoke all on all functions in schema public from public, anon;
grant execute on function
  public.claim_invitation(), public.invite_user(text, text), public.revoke_invitation(uuid),
  public.set_user_role(uuid, text), public.set_user_active(uuid, boolean),
  public.list_data_set_names(), public.report_incident(text, text, timestamptz, uuid[]),
  public.get_incident_text(uuid), public.update_incident_text(uuid, text, text),
  public.set_awareness_time(uuid, timestamptz),
  public.confirm_exposure(uuid, uuid[], int), public.run_assessment(uuid, jsonb),
  public.suggested_decision(uuid), public.record_decision(uuid, boolean, boolean, text),
  public.prefill_notification(uuid), public.save_notification_draft(uuid, text, jsonb, uuid),
  public.submit_notification(uuid), public.approve_notification(uuid),
  public.return_notification(uuid, text),
  public.record_notification_sent(uuid, timestamptz, text, text, text),
  public.mark_followup_done(uuid), public.complete_task(uuid), public.close_incident(uuid)
to authenticated;
