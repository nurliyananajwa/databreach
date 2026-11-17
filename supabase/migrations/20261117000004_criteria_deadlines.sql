-- Notification criteria (proposal Table 24), encryption helpers and the deadline engine.

-- ---------------------------------------------------------------- criteria
-- Stored as data with a guideline version, so a future guideline adds rows
-- instead of changing past assessments.
insert into public.criteria (code, guideline_version, kind, method, description, effect, source_ref) values
('SCALE_1000', 'DBN-1.0-2025', 'scale', 'auto',
 'Significant scale: more than 1,000 data subjects are affected.',
 'commissioner', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)'),
('SENSITIVE_DATA', 'DBN-1.0-2025', 'harm', 'auto',
 'The breach involves sensitive personal data (health, religion, politics, offences, biometric).',
 'commissioner_and_subjects', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)'),
('FINANCIAL_LOSS', 'DBN-1.0-2025', 'harm', 'auto',
 'The breach may cause financial loss or a negative effect on credit records.',
 'commissioner_and_subjects', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)'),
('IDENTITY_FRAUD', 'DBN-1.0-2025', 'harm', 'auto',
 'The exposed data together could enable identity fraud (an ID number with contact or financial data).',
 'commissioner_and_subjects', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)'),
('PHYSICAL_PROPERTY', 'DBN-1.0-2025', 'harm', 'judgement',
 'The breach may cause physical harm, or damage to or loss of property.',
 'commissioner_and_subjects', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)'),
('ILLEGAL_MISUSE', 'DBN-1.0-2025', 'harm', 'judgement',
 'The data may be misused for illegal purposes.',
 'commissioner_and_subjects', 'PDP Guideline on Data Breach Notification v1.0 (25 Feb 2025)');

create function private.current_guideline() returns text
language sql immutable set search_path = '' as $$ select 'DBN-1.0-2025' $$;

-- ---------------------------------------------------------------- encryption
-- Key lives in Supabase Vault (secret name: pdpa_enc_key). Never sent to the browser.
create function private.enc_key() returns text
language plpgsql stable security definer set search_path = '' as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'pdpa_enc_key';
  if k is null then
    raise exception 'Encryption key pdpa_enc_key is missing from Vault';
  end if;
  return k;
end $$;

create function private.encrypt(p text) returns bytea
language sql stable security definer set search_path = '' as $$
  select case when p is null then null else extensions.pgp_sym_encrypt(p, private.enc_key()) end
$$;

create function private.decrypt(p bytea) returns text
language sql stable security definer set search_path = '' as $$
  select case when p is null then null else extensions.pgp_sym_decrypt(p, private.enc_key()) end
$$;

revoke all on function private.enc_key(), private.encrypt(text), private.decrypt(bytea) from public, authenticated;

-- ---------------------------------------------------------------- deadline engine
-- Commissioner: 72 h after awareness.
-- Individuals:  7 days after the Commissioner was notified (provisional until then).
-- Follow-up:    30 days after the Commissioner was notified (provisional until then).
-- Calculated only here; users have no write access to `deadlines`.
create function private.add_kl_days(ts timestamptz, days int) returns timestamptz
language sql immutable set search_path = '' as $$
  select ((ts at time zone 'Asia/Kuala_Lumpur') + make_interval(days => days)) at time zone 'Asia/Kuala_Lumpur'
$$;

create function private.refresh_deadlines(p_incident uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  i   public.incidents;
  d   public.decisions;
  c_sent timestamptz;   -- Commissioner notified
  s_sent timestamptz;   -- individuals notified
  u_sent timestamptz;   -- phased update sent
  v_due  timestamptz;
  v_met  timestamptz;
  v_status text;
  v_prov boolean;
begin
  select * into i from public.incidents where id = p_incident;
  if not found then return; end if;

  select * into d from public.decisions where incident_id = p_incident
  order by decided_at desc, id desc limit 1;

  select min(sent_at) into c_sent from public.notifications
   where incident_id = p_incident and recipient = 'commissioner' and status = 'sent';
  select min(sent_at) into s_sent from public.notifications
   where incident_id = p_incident and recipient = 'data_subjects' and status = 'sent';
  select min(sent_at) into u_sent from public.notifications
   where incident_id = p_incident and recipient = 'commissioner_update' and status = 'sent';

  -- 1. Commissioner, 72 hours
  v_due := i.aware_at + interval '72 hours';
  v_met := null;
  if d.id is not null and not d.notify_commissioner then
    v_status := 'not_required';
  elsif c_sent is not null then
    v_met := c_sent;
    v_status := case when c_sent <= v_due then 'met' else 'missed' end;
  else
    v_status := 'open';
  end if;
  insert into public.deadlines as x (incident_id, type, due_at, provisional, met_at, status)
  values (p_incident, 'commissioner_72h', v_due, false, v_met, v_status)
  on conflict (incident_id, type) do update
    set due_at = excluded.due_at, provisional = excluded.provisional,
        met_at = excluded.met_at, status = excluded.status
    where (x.due_at, x.provisional, x.met_at, x.status) is distinct from
          (excluded.due_at, excluded.provisional, excluded.met_at, excluded.status);

  -- 2. Individuals, 7 days after the Commissioner notice
  v_prov := c_sent is null;
  v_due  := private.add_kl_days(coalesce(c_sent, i.aware_at + interval '72 hours'), 7);
  v_met  := null;
  if d.id is not null and not d.notify_subjects then
    v_status := 'not_required';
  elsif s_sent is not null then
    v_met := s_sent;
    v_status := case when s_sent <= v_due then 'met' else 'missed' end;
  else
    v_status := 'open';
  end if;
  insert into public.deadlines as x (incident_id, type, due_at, provisional, met_at, status)
  values (p_incident, 'subjects_7d', v_due, v_prov, v_met, v_status)
  on conflict (incident_id, type) do update
    set due_at = excluded.due_at, provisional = excluded.provisional,
        met_at = excluded.met_at, status = excluded.status
    where (x.due_at, x.provisional, x.met_at, x.status) is distinct from
          (excluded.due_at, excluded.provisional, excluded.met_at, excluded.status);

  -- 3. Phased follow-up, 30 days after the Commissioner notice
  v_due := private.add_kl_days(coalesce(c_sent, i.aware_at + interval '72 hours'), 30);
  v_met := null;
  if d.id is not null and not d.notify_commissioner then
    v_status := 'not_required';
  elsif coalesce(u_sent, i.followup_done_at) is not null then
    v_met := coalesce(u_sent, i.followup_done_at);
    v_status := case when v_met <= v_due then 'met' else 'missed' end;
  else
    v_status := 'open';
  end if;
  insert into public.deadlines as x (incident_id, type, due_at, provisional, met_at, status)
  values (p_incident, 'followup_30d', v_due, v_prov, v_met, v_status)
  on conflict (incident_id, type) do update
    set due_at = excluded.due_at, provisional = excluded.provisional,
        met_at = excluded.met_at, status = excluded.status
    where (x.due_at, x.provisional, x.met_at, x.status) is distinct from
          (excluded.due_at, excluded.provisional, excluded.met_at, excluded.status);
end $$;

create function private.trg_refresh_deadlines() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_deadlines(case when tg_table_name = 'incidents' then (to_jsonb(new) ->> 'id')::uuid
                                         else (to_jsonb(new) ->> 'incident_id')::uuid end);
  return null;
end $$;

create trigger deadlines_on_incident after insert or update of aware_at, followup_done_at on public.incidents
  for each row execute function private.trg_refresh_deadlines();
create trigger deadlines_on_decision after insert on public.decisions
  for each row execute function private.trg_refresh_deadlines();
create trigger deadlines_on_notification after insert or update of status, sent_at on public.notifications
  for each row execute function private.trg_refresh_deadlines();

-- Overdue is derived from the clock, so it is a view, not a stored status.
create view public.deadline_status with (security_invoker = true) as
select d.*,
       (d.status = 'open' and now() > d.due_at) as is_overdue,
       greatest(d.due_at - now(), interval '0') as time_left
from public.deadlines d;
grant select on public.deadline_status to authenticated;
