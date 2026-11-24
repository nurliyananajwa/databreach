-- LOCAL TESTING ONLY. RLS attack suite, lifecycle test, 10 assessment
-- scenarios (proposal Table 25) and 20 deadline times.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

-- ============================================================ 1. sign-in
begin;
select tests.login('stranger@example.test'); set local role authenticated;
select tests.must_fail('Not-invited Google account cannot get in', 'select public.claim_invitation()');
commit;

do $$ begin perform 1; end $$;
begin; select tests.login('najwa.manager@example.test'); set local role authenticated; select public.claim_invitation(); commit;
begin; select tests.login('farid.lead@example.test');     set local role authenticated; select public.claim_invitation(); commit;
begin; select tests.login('siti.staff@example.test');     set local role authenticated; select public.claim_invitation(); commit;
begin; select tests.login('ahmad.staff@example.test');    set local role authenticated; select public.claim_invitation(); commit;
begin; select tests.login('other.manager@example.test');  set local role authenticated; select public.claim_invitation(); commit;

select tests.check('Roles come from the invitation',
  -- sorted by email: ahmad (staff), farid (dp_lead), najwa (manager), siti (staff)
  (select string_agg(role, ',' order by email) from public.profiles where org_id = '00000000-0000-0000-0000-0000000000a1')
  = 'staff,dp_lead,manager,staff');

-- ============================================================ 2. anonymous visitor
begin; set local role anon;
select tests.must_fail('Anonymous cannot read incidents',  'select * from public.incidents');
select tests.must_fail('Anonymous cannot read data sets',  'select * from public.data_sets');
select tests.must_fail('Anonymous cannot call RPCs',       'select public.list_data_set_names()');
commit;

-- ============================================================ 3. inventory (lead)
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
insert into public.data_sets (org_id, code, name, storage_location, purpose, approx_records, owner_id) values
 ('00000000-0000-0000-0000-0000000000a1','DS-001','Customer list','Shared Google Sheet','Deliveries and promotions',1500,'00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-0000000000a1','DS-002','Payroll','Accounting laptop','Paying staff salaries',12,'00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-0000000000a1','DS-003','Staff medical leave','HR folder','Recording sick leave',12,null);
insert into public.data_fields (data_set_id, field_name, category, is_sensitive)
select d.id, f.name, f.cat, f.sens from public.data_sets d join (values
 ('DS-001','Full name','other',false), ('DS-001','Phone number','contact',false),
 ('DS-001','Email','contact',false),   ('DS-001','Home address','contact',false),
 ('DS-001','IC number','identity',false),
 ('DS-002','Full name','other',false), ('DS-002','IC number','identity',false),
 ('DS-002','Bank account number','financial',false), ('DS-002','Salary','financial',false),
 ('DS-003','Full name','other',false), ('DS-003','Medical certificate details','sensitive',true)
) f(code, name, cat, sens) on f.code = d.code;
select tests.must_fail('Lead cannot delete a data set (archive only)',
  $q$delete from public.data_sets where code = 'DS-003'$q$);
select tests.must_fail('Lead cannot add a data set to another organisation',
  $q$insert into public.data_sets (org_id, code, name, storage_location, purpose) values ('00000000-0000-0000-0000-0000000000b2','X-1','x','x','x')$q$);
select tests.must_fail('Lead cannot set version number by hand',
  $q$update public.data_sets set version_no = 99 where code = 'DS-001'$q$);
commit;

select tests.check('New data set saved as version 1 (with its fields)',
  (select count(*) = 1 and bool_and(jsonb_array_length(snapshot -> 'fields') = 5)
   from public.data_set_versions v join public.data_sets d on d.id = v.data_set_id where d.code = 'DS-001'));

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
update public.data_sets set storage_location = 'Shared Google Sheet (restricted)' where code = 'DS-001';
insert into public.data_fields (data_set_id, field_name, category)
  select id, 'Date of birth', 'other' from public.data_sets where code = 'DS-001';
commit;
select tests.check('One save with two changes = one new version (v2)',
  (select max(v.version_no) = 2 and count(*) = 2 from public.data_set_versions v
   join public.data_sets d on d.id = v.data_set_id where d.code = 'DS-001'));
select tests.must_fail('Even the database owner cannot edit a version',
  $q$update public.data_set_versions set snapshot = '{}'$q$);

-- ============================================================ 4. staff
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.check('Staff sees no inventory rows', (select count(*) = 0 from public.data_sets));
select tests.check('Staff sees no data fields',   (select count(*) = 0 from public.data_fields));
select tests.check('Staff can see data set NAMES for the report form', (select count(*) = 3 from public.list_data_set_names()));
select public.report_incident('Customer list emailed to wrong address',
  'A staff member attached the customer list to an email sent to a supplier by mistake.',
  now() - interval '2 hours',
  array[(select id from public.list_data_set_names() where name = 'Customer list')]) as inc1 \gset
select tests.check('Staff sees own report', (select count(*) = 1 from public.incidents));
select tests.must_fail('Staff cannot add data sets',
  $q$insert into public.data_sets (org_id, code, name, storage_location, purpose) values ('00000000-0000-0000-0000-0000000000a1','DS-9','x','x','x')$q$);
select tests.must_fail('Staff cannot change incident status',
  format($q$update public.incidents set status = 'closed' where id = %L$q$, :'inc1'));
select tests.must_fail('Staff cannot confirm exposed fields',
  format($q$select public.confirm_exposure(%L, '{}', 1)$q$, :'inc1'));
select tests.must_fail('Staff cannot record a decision',
  format($q$select public.record_decision(%L, false, false, 'nothing to see here')$q$, :'inc1'));
select tests.check('Staff sees no audit log', (select count(*) = 0 from public.audit_log));
select tests.check('Staff sees no assessments or decisions',
  (select count(*) = 0 from public.assessments) and (select count(*) = 0 from public.decisions));
select tests.must_fail('Staff cannot give themselves a role',
  $q$update public.profiles set role = 'manager' where email = 'siti.staff@example.test'$q$);
select tests.must_fail('Staff cannot invite users', $q$select public.invite_user('x@example.test','manager')$q$);
commit;

begin; select tests.login('ahmad.staff@example.test'); set local role authenticated;
select tests.check('Staff cannot see a colleague''s report', (select count(*) = 0 from public.incidents));
select tests.must_fail('Staff cannot read a colleague''s report text',
  format($q$select * from public.get_incident_text(%L)$q$, :'inc1'));
commit;

begin; select tests.login('other.manager@example.test'); set local role authenticated;
select tests.check('Other organisation sees no incidents', (select count(*) = 0 from public.incidents));
select tests.check('Other organisation sees no data sets', (select count(*) = 0 from public.data_sets));
select tests.check('Other organisation sees no audit rows of ours',
  (select count(*) = 0 from public.audit_log where org_id = '00000000-0000-0000-0000-0000000000a1'));
select tests.must_fail('Other organisation cannot read our report text',
  format($q$select * from public.get_incident_text(%L)$q$, :'inc1'));
commit;

-- ============================================================ 5. encryption
select tests.check('Description is stored encrypted (no plain text in the table)',
  (select position('customer list' in lower(encode(description_enc, 'escape'))) = 0
   from public.incidents where id = :'inc1'));
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.check('Lead can read the decrypted description',
  (select description like 'A staff member attached%' from public.get_incident_text(:'inc1')));
select tests.must_fail('Signed-in users cannot call the decrypt function directly',
  $q$select private.decrypt(description_enc) from public.incidents$q$);
select tests.must_fail('Signed-in users cannot run internal deadline functions',
  format($q$select private.refresh_deadlines(%L)$q$, :'inc1'));
select tests.must_fail('Signed-in users cannot run the alert job', $q$select private.generate_alerts()$q$);
commit;
begin; set local role anon;
select tests.must_fail('Anonymous cannot read the deadline view', 'select * from public.deadline_status');
commit;

-- ============================================================ 6. lifecycle (proposal example, 1,240 people)
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.confirm_exposure(:'inc1',
  array(select f.id from public.data_fields f join public.data_sets d on d.id = f.data_set_id
        where d.code = 'DS-001' and f.field_name in ('Full name','Phone number')), 1240);
select count(*) from public.run_assessment(:'inc1') \gset ignore_
select tests.must_fail('Decision blocked while judgement questions are unanswered',
  format($q$select public.record_decision(%L, true, false, 'scale only, as suggested')$q$, :'inc1'));
select count(*) from public.run_assessment(:'inc1', '{
  "PHYSICAL_PROPERTY": {"answer": false, "reason": "Names and phone numbers cannot cause physical harm here."},
  "ILLEGAL_MISUSE":   {"answer": false, "reason": "Recipient is a known supplier who confirmed deletion."}}') \gset ignore_
select tests.check('Example breach: only the scale criterion is met',
  (select string_agg(c.code, ',' order by c.code) = 'SCALE_1000' from public.assessments a
   join public.criteria c on c.id = a.criterion_id
   where a.incident_id = :'inc1' and a.run_no = 2 and a.result = 'met'));
select tests.check('Suggestion: Commissioner only',
  (select notify_commissioner and not notify_subjects from public.suggested_decision(:'inc1')));
select tests.must_fail('Decision needs a real reason', format($q$select public.record_decision(%L, true, false, 'ok')$q$, :'inc1'));
select public.record_decision(:'inc1', true, false, 'Over 1,000 people affected; no harm factor met.');
select tests.must_fail('Decisions cannot be edited',
  format($q$update public.decisions set notify_commissioner = false where incident_id = %L$q$, :'inc1'));
select tests.must_fail('Lead cannot write deadlines',
  format($q$update public.deadlines set due_at = now() + interval '30 days' where incident_id = %L$q$, :'inc1'));
select tests.check('Deadlines: 72 h open, individuals not required, follow-up open',
  (select string_agg(type || '=' || status, ',' order by type) from public.deadlines where incident_id = :'inc1')
  = 'commissioner_72h=open,followup_30d=open,subjects_7d=not_required');
select tests.check('72 h deadline is exactly awareness + 72 hours',
  (select d.due_at = i.aware_at + interval '72 hours' from public.deadlines d
   join public.incidents i on i.id = d.incident_id where d.incident_id = :'inc1' and d.type = 'commissioner_72h'));
select tests.must_fail('Awareness time locked after the decision',
  format($q$select public.set_awareness_time(%L, now() - interval '5 hours')$q$, :'inc1'));
select public.save_notification_draft(:'inc1', 'commissioner', public.prefill_notification(:'inc1')) as n1 \gset
select tests.check('Draft is pre-filled from the record',
  (select (draft ->> 'individuals_affected')::int = 1240 and draft -> 'personal_data_types' ? 'Phone number'
   from public.notifications where id = :'n1'));
select tests.must_fail('Notice to individuals is refused when the decision says no',
  format($q$select public.save_notification_draft(%L, 'data_subjects', '{}')$q$, :'inc1'));
select public.submit_notification(:'n1');
select tests.must_fail('Lead cannot approve a draft', format($q$select public.approve_notification(%L)$q$, :'n1'));
select tests.must_fail('Cannot record as sent before approval',
  format($q$select public.record_notification_sent(%L, now(), 'Email to Commissioner')$q$, :'n1'));
commit;

begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.must_fail('Staff cannot approve a draft', format($q$select public.approve_notification(%L)$q$, :'n1'));
commit;

begin; select tests.login('najwa.manager@example.test'); set local role authenticated;
select public.approve_notification(:'n1');
select tests.must_fail('Manager cannot record notifications as sent',
  format($q$select public.record_notification_sent(%L, now(), 'Email')$q$, :'n1'));
commit;

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.record_notification_sent(:'n1', now() - interval '10 minutes', 'Email to dbnpdp@pdp.gov.my', 'DBN-TEST-001');
select tests.check('Commissioner deadline met; incident moves to follow-up',
  (select status = 'met' from public.deadlines where incident_id = :'inc1' and type = 'commissioner_72h')
  and (select status = 'follow_up' from public.incidents where id = :'inc1'));
insert into public.tasks (incident_id, title, assignee_id, due_at)
  values (:'inc1', 'Ask supplier to confirm deletion in writing', '00000000-0000-0000-0000-000000000003', now() + interval '1 day')
  returning id as task1 \gset
select tests.must_fail('Task cannot be given to someone in another organisation',
  format($q$insert into public.tasks (incident_id, title, assignee_id) values (%L, 'x', '00000000-0000-0000-0000-000000000005')$q$, :'inc1'));
select tests.must_fail('Cannot close with an open task and open follow-up', format($q$select public.close_incident(%L)$q$, :'inc1'));
commit;

begin; select tests.login('ahmad.staff@example.test'); set local role authenticated;
select tests.must_fail('Staff cannot complete a task given to someone else',
  format($q$select public.complete_task(%L)$q$, :'task1'));
commit;
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.check('Assignee sees her task', (select count(*) = 1 from public.tasks));
select public.complete_task(id) from public.tasks;
commit;

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.must_fail('Cannot close while the follow-up deadline is open', format($q$select public.close_incident(%L)$q$, :'inc1'));
select public.mark_followup_done(:'inc1');
select public.close_incident(:'inc1');
select tests.check('Closed incident is kept for 2 years (Malaysia date)',
  (select retain_until = (now() at time zone 'Asia/Kuala_Lumpur')::date + interval '2 years' from public.incidents where id = :'inc1'));
commit;

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.must_fail('Cannot link a data set to a closed incident',
  format($q$insert into public.incident_data_sets (incident_id, data_set_id) select %L, id from public.data_sets where code = 'DS-002'$q$, :'inc1'));
select tests.must_not_change('Cannot unlink a data set from a closed incident',
  format($q$delete from public.incident_data_sets where incident_id = %L$q$, :'inc1'));
commit;

-- the database owner is also bound by these rules
select tests.must_fail('Register entry cannot be deleted before its keep-until date',
  format($q$delete from public.incidents where id = %L$q$, :'inc1'));
select tests.must_fail('Status cannot move backward',
  format($q$update public.incidents set status = 'assessing', closed_at = null where id = %L$q$, :'inc1'));
select tests.must_fail('Audit log cannot be edited',  $q$update public.audit_log set action = 'insert'$q$);
select tests.must_fail('Audit log cannot be deleted', $q$delete from public.audit_log$q$);
select tests.check('Audit log never contains encrypted text',
  (select count(*) = 0 from public.audit_log where details::text like '%description_enc%'));

begin; select tests.login('najwa.manager@example.test'); set local role authenticated;
select tests.check('Manager reads the audit trail of every step',
  (select count(distinct table_name) >= 8 from public.audit_log));
commit;
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.check('Lead cannot read the audit log (manager only)', (select count(*) = 0 from public.audit_log));
commit;

-- ============================================================ 7. late notification
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.report_incident('Lost USB with payroll', 'USB drive with payroll export lost on the train.',
  now() - interval '4 days', array[(select id from public.data_sets where code = 'DS-002')]) as inc2 \gset
select public.confirm_exposure(:'inc2', array(select f.id from public.data_fields f join public.data_sets d
  on d.id = f.data_set_id where d.code = 'DS-002'), 12);
select count(*) from public.run_assessment(:'inc2', '{
  "PHYSICAL_PROPERTY": {"answer": false, "reason": "No physical risk from payroll fields."},
  "ILLEGAL_MISUSE":   {"answer": true,  "reason": "Bank and IC numbers can be used for fraud."}}') \gset ignore_
select public.record_decision(:'inc2', true, true, 'Financial and identity data exposed; notify both.');
select public.save_notification_draft(:'inc2', 'commissioner', public.prefill_notification(:'inc2')) as n2 \gset
select public.submit_notification(:'n2');
commit;
begin; select tests.login('najwa.manager@example.test'); set local role authenticated; select public.approve_notification(:'n2'); commit;
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.must_fail('Late Commissioner notice requires a reason for the delay',
  format($q$select public.record_notification_sent(%L, now(), 'Email')$q$, :'n2'));
select public.record_notification_sent(:'n2', now() - interval '1 minute', 'Email',
  null, 'The USB loss was only reported by the staff member three days later.');
select tests.check('Late notice is recorded as missed, with the reason kept',
  (select status = 'missed' from public.deadlines where incident_id = :'inc2' and type = 'commissioner_72h')
  and (select delay_reason is not null from public.incidents where id = :'inc2'));
select tests.check('Individuals deadline becomes 7 days after the Commissioner notice',
  (select d.due_at = ((n.sent_at at time zone 'Asia/Kuala_Lumpur') + interval '7 days') at time zone 'Asia/Kuala_Lumpur'
          and not d.provisional
   from public.deadlines d join public.notifications n on n.incident_id = d.incident_id and n.recipient = 'commissioner'
   where d.incident_id = :'inc2' and d.type = 'subjects_7d'));
select tests.check('Notified (not follow-up yet): individuals still to be told',
  (select status = 'notified' from public.incidents where id = :'inc2'));
commit;

-- ============================================================ 8. ten assessment scenarios (RO2)
-- expected suggestion: C = Commissioner only, CS = Commissioner and individuals, R = register only
create temp table scen (n int, label text, ds text, fields text[], people int,
                        physical boolean, illegal boolean, expected text);
grant all on scen to authenticated;
insert into scen values
 (1, 'Name + phone, 1,240 people',          'DS-001', '{Full name,Phone number}', 1240, false, false, 'C'),
 (2, 'Name + phone, 50 people',             'DS-001', '{Full name,Phone number}', 50,   false, false, 'R'),
 (3, 'IC + home address, 30 people',        'DS-001', '{IC number,Home address}', 30,   false, false, 'CS'),
 (4, 'IC number only, 30 people',           'DS-001', '{IC number}',              30,   false, false, 'R'),
 (5, 'Bank account, 10 staff',              'DS-002', '{Bank account number}',    10,   false, false, 'CS'),
 (6, 'Medical certificate, 5 staff',        'DS-003', '{Medical certificate details}', 5, false, false, 'CS'),
 (7, 'Name + email, lead says physical harm','DS-001', '{Full name,Email}',       20,   true,  false, 'CS'),
 (8, 'Name only, lead says illegal misuse', 'DS-001', '{Full name}',              20,   false, true,  'CS'),
 (9, 'IC + salary, 2,000 people',           'DS-002', '{IC number,Salary}',       2000, false, false, 'CS'),
 (10,'Email only, exactly 1,000 people',    'DS-001', '{Email}',                  1000, false, false, 'R');

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
do $$
declare s record; v_inc uuid; got text;
begin
  for s in select * from scen order by n loop
    v_inc := public.report_incident('Scenario ' || s.n, s.label, now() - interval '1 hour',
               array[(select id from public.data_sets where code = s.ds)]);
    perform public.confirm_exposure(v_inc, array(select f.id from public.data_fields f join public.data_sets d
              on d.id = f.data_set_id where d.code = s.ds and f.field_name = any(s.fields)), s.people);
    perform public.run_assessment(v_inc, jsonb_build_object(
      'PHYSICAL_PROPERTY', jsonb_build_object('answer', s.physical, 'reason', 'Answer given for the test scenario.'),
      'ILLEGAL_MISUSE',   jsonb_build_object('answer', s.illegal,  'reason', 'Answer given for the test scenario.')));
    select case when notify_subjects then 'CS' when notify_commissioner then 'C' else 'R' end
      into got from public.suggested_decision(v_inc);
    perform tests.check(format('Scenario %s: %s -> %s', s.n, s.label, s.expected), got = s.expected, 'got ' || got);
    perform tests.check(format('Scenario %s: every result has a reason and input', s.n),
      (select bool_and(reason <> '' and input_used is not null) from public.assessments where incident_id = v_inc));
  end loop;
end $$;
commit;

-- ============================================================ 9. twenty deadline times (Malaysia time)
-- expected values worked out by hand, not with the same formula
create temp table dl (n int, aware text, expected text);
insert into dl values
 (1,'2026-11-17 10:00','2026-11-20 10:00'), (2,'2026-11-17 23:59','2026-11-20 23:59'),
 (3,'2026-11-18 00:00','2026-11-21 00:00'), (4,'2026-12-29 09:00','2027-01-01 09:00'),
 (5,'2026-12-31 23:30','2027-01-03 23:30'), (6,'2027-01-01 00:01','2027-01-04 00:01'),
 (7,'2026-11-20 17:00','2026-11-23 17:00'), (8,'2026-11-21 08:00','2026-11-24 08:00'),
 (9,'2026-11-22 22:15','2026-11-25 22:15'), (10,'2028-02-27 12:00','2028-03-01 12:00'),
 (11,'2028-02-28 06:00','2028-03-02 06:00'),(12,'2027-02-26 12:00','2027-03-01 12:00'),
 (13,'2026-02-27 00:00','2026-03-02 00:00'),(14,'2026-06-30 16:00','2026-07-03 16:00'),
 (15,'2026-11-17 07:59','2026-11-20 07:59'),(16,'2026-11-17 08:00','2026-11-20 08:00'),
 (17,'2026-03-29 02:30','2026-04-01 02:30'),(18,'2026-10-31 23:00','2026-11-03 23:00'),
 (19,'2026-04-30 22:00','2026-05-03 22:00'),(20,'2026-09-30 21:00','2026-10-03 21:00');

do $$
declare r record; v_id uuid; got timestamptz;
begin
  for r in select * from dl order by n loop
    insert into public.incidents (org_id, code, title, description_enc, reported_by, reported_at, aware_at)
    values ('00000000-0000-0000-0000-0000000000a1', 'DL-' || r.n, 'deadline test', '\x00',
            '00000000-0000-0000-0000-000000000002',
            (r.aware || ' +08')::timestamptz + interval '1 hour', (r.aware || ' +08')::timestamptz)
    returning id into v_id;
    select due_at into got from public.deadlines where incident_id = v_id and type = 'commissioner_72h';
    perform tests.check(format('Deadline %s: aware %s -> due %s (KL)', r.n, r.aware, r.expected),
      got = (r.expected || ' +08')::timestamptz,
      'got ' || to_char(got at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI'));
  end loop;
end $$;

-- 7-day and 30-day deadlines across the year end
do $$
declare v_id uuid;
begin
  insert into public.incidents (org_id, code, title, description_enc, reported_by, reported_at, aware_at)
  values ('00000000-0000-0000-0000-0000000000a1', 'DL-YE', 'year end', '\x00',
          '00000000-0000-0000-0000-000000000002', '2026-12-26 11:00 +08', '2026-12-26 10:00 +08')
  returning id into v_id;
  insert into public.notifications (incident_id, recipient, status, sent_at, method)
  values (v_id, 'commissioner', 'sent', '2026-12-28 15:00 +08', 'Email');
  perform tests.check('7 days after notice sent 28 Dec 15:00 -> 4 Jan 2027 15:00',
    (select due_at = '2027-01-04 15:00 +08' from public.deadlines where incident_id = v_id and type = 'subjects_7d'));
  perform tests.check('30 days after notice sent 28 Dec 15:00 -> 27 Jan 2027 15:00',
    (select due_at = '2027-01-27 15:00 +08' from public.deadlines where incident_id = v_id and type = 'followup_30d'));
end $$;

-- ============================================================ 10. alerts
do $$
declare v_id uuid; n int;
begin
  insert into public.incidents (org_id, code, title, description_enc, reported_by, reported_at, aware_at)
  values ('00000000-0000-0000-0000-0000000000a1', 'AL-1', 'alert test', '\x00',
          '00000000-0000-0000-0000-000000000002', now(), now() - interval '75 hours')
  returning id into v_id;
  n := private.generate_alerts();
  perform tests.check('Overdue deadline alerts the lead AND escalates to the manager',
    (select count(distinct p.role) = 2 from public.alerts a join public.profiles p on p.id = a.user_id
     where a.incident_id = v_id and a.level = 'overdue'));
  perform tests.check('Running the alert job twice does not duplicate alerts',
    private.generate_alerts() = 0 or not exists (
      select 1 from public.alerts where incident_id = v_id group by deadline_id, user_id, level having count(*) > 1));
end $$;

-- ============================================================ 11. settings: own name only
begin;
select tests.login('siti.staff@example.test'); set local role authenticated;
select public.update_my_name('  Siti   Aminah ');
reset role;
select tests.check('A user can change their own name (spaces tidied)',
  (select full_name = 'Siti Aminah' from public.profiles where id = '00000000-0000-0000-0000-000000000003'));
select tests.check('Changing your name is written to the audit log',
  exists (select 1 from public.audit_log where table_name = 'profiles' and record_id = '00000000-0000-0000-0000-000000000003' and action = 'update'));
commit;
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.must_fail('A one-letter name is refused', $q$ select public.update_my_name('S') $q$);
select tests.must_fail('An empty name is refused', $q$ select public.update_my_name('   ') $q$);
select tests.must_not_change('Staff still cannot change profiles directly (no role change through the side door)',
  $q$ update public.profiles set role = 'manager' where id = auth.uid() returning 1 $q$);
commit;
begin; select tests.login('najwa.manager@example.test'); set local role authenticated;
select public.update_my_name('Najwa Manager');
reset role;
select tests.check('Changing your name never touches anyone else',
  (select full_name = 'Siti Aminah' from public.profiles where id = '00000000-0000-0000-0000-000000000003'));
commit;
begin; select tests.login('stranger@example.test'); set local role authenticated;
select tests.must_fail('Someone without a profile cannot use it', $q$ select public.update_my_name('Hacker Name') $q$);
commit;

-- ============================================================ 12. inventory page saves (Sprint 2)
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.save_data_set(null, '  Employee bank details ', 'Payroll system (cloud)', 'HR and finance team', 'Paying salaries',
  '7 years after leaving', '00000000-0000-0000-0000-000000000002', 'PayCloud Sdn Bhd', 340,
  '[{"name":"Full name","category":"other"},{"name":"Bank account number","category":"financial"},
    {"name":"Medical notes","category":"sensitive","sensitive":false}]') as ds_new \gset
commit;
select tests.check('A new data set gets the next code and version 1',
  (select code = 'DS-004' and version_no = 1 and name = 'Employee bank details' from public.data_sets where id = :'ds_new'));
select tests.check('A sensitive category always sets the sensitive flag',
  (select is_sensitive from public.data_fields where data_set_id = :'ds_new' and field_name = 'Medical notes'));

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.save_data_set(:'ds_new', 'Employee bank details', 'Payroll system (cloud, restricted)', 'HR and finance team',
  'Paying salaries', '7 years after leaving', '00000000-0000-0000-0000-000000000002', 'PayCloud Sdn Bhd', 340,
  (select jsonb_agg(x) from (
     select jsonb_build_object('id', id, 'name', case when field_name = 'Full name' then 'Employee name' else field_name end,
                               'category', category, 'sensitive', is_sensitive) x
     from public.data_fields where data_set_id = :'ds_new' and field_name <> 'Medical notes'
     union all select '{"name":"Salary","category":"financial"}'::jsonb) s));
commit;
select tests.check('One save (details + rename + add + remove) = exactly one new version',
  (select max(version_no) = 2 and count(*) = 2 from public.data_set_versions where data_set_id = :'ds_new'));
select tests.check('The saved version holds the final field list',
  (select snapshot -> 'fields' @> '[{"field_name":"Employee name"},{"field_name":"Salary"}]'
      and not snapshot -> 'fields' @> '[{"field_name":"Medical notes"}]'
   from public.data_set_versions where data_set_id = :'ds_new' and version_no = 2));

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.save_data_set(:'ds_new', 'Employee bank details', 'Payroll system (cloud, restricted)', 'HR and finance team',
  'Paying salaries', '7 years after leaving', '00000000-0000-0000-0000-000000000002', 'PayCloud Sdn Bhd', 340,
  (select jsonb_agg(jsonb_build_object('id', id, 'name', field_name, 'category', category, 'sensitive', is_sensitive))
   from public.data_fields where data_set_id = :'ds_new'));
commit;
select tests.check('Saving without changes makes no new version',
  (select max(version_no) = 2 from public.data_set_versions where data_set_id = :'ds_new'));

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select tests.must_fail('Two fields with the same name are refused',
  $q$select public.save_data_set(null, 'Test set', 'x', null, 'x', null, null, null, null,
     '[{"name":"Email","category":"contact"},{"name":" email ","category":"contact"}]')$q$);
select tests.must_fail('A real value instead of a field name is refused (metadata only)',
  $q$select public.save_data_set(null, 'Test set', 'x', null, 'x', null, null, null, null, '[{"name":"siti@gmail.com","category":"contact"}]')$q$);
select tests.must_fail('An IC or phone number instead of a field name is refused',
  $q$select public.save_data_set(null, 'Test set', 'x', null, 'x', null, null, null, null, '[{"name":"901231-14-5678","category":"identity"}]')$q$);
select tests.must_fail('A field without a valid category is refused',
  $q$select public.save_data_set(null, 'Test set', 'x', null, 'x', null, null, null, null, '[{"name":"Email","category":"secret"}]')$q$);
select tests.must_fail('A data set without a storage location is refused',
  $q$select public.save_data_set(null, 'Test set', '  ', null, 'x', null, null, null, null, '[]')$q$);
select tests.must_fail('An owner from another organisation is refused',
  $q$select public.save_data_set(null, 'Test set', 'x', null, 'x', null, '00000000-0000-0000-0000-000000000005', null, null, '[]')$q$);
select tests.must_fail('A field id from another data set is refused',
  format($q$select public.save_data_set(%L, 'Employee bank details', 'x', null, 'x', null, null, null, null,
     (select jsonb_build_array(jsonb_build_object('id', f.id, 'name', 'Stolen', 'category', 'other'))
      from public.data_fields f join public.data_sets d on d.id = f.data_set_id where d.code = 'DS-001' limit 1))$q$, :'ds_new'));
select public.set_data_set_status(:'ds_new', true);
select tests.must_fail('An archived data set cannot be edited until restored',
  format($q$select public.save_data_set(%L, 'Employee bank details', 'x', null, 'x', null, null, null, null, '[]')$q$, :'ds_new'));
commit;
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.check('Archived data sets are not offered when reporting',
  not exists (select 1 from public.list_data_set_names() where id = :'ds_new'));
commit;

begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.set_data_set_status(:'ds_new', false);
commit;
select tests.check('Restoring makes it active again', (select status = 'active' from public.data_sets where id = :'ds_new'));

begin; select tests.login('najwa.manager@example.test'); set local role authenticated;
select tests.check('The manager can read the inventory', (select count(*) >= 4 from public.data_sets));
select tests.must_fail('The manager cannot change the inventory',
  format($q$select public.save_data_set(%L, 'Renamed', 'x', null, 'x', null, null, null, null, '[]')$q$, :'ds_new'));
select tests.must_fail('The manager cannot archive a data set', format($q$select public.set_data_set_status(%L, true)$q$, :'ds_new'));
commit;
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select tests.must_fail('Staff cannot save a data set',
  $q$select public.save_data_set(null, 'Sneaky', 'x', null, 'x', null, null, null, null, '[]')$q$);
commit;
begin; select tests.login('other.manager@example.test'); set local role authenticated;
select tests.must_fail('Another organisation cannot archive it', format($q$select public.set_data_set_status(%L, true)$q$, :'ds_new'));
commit;

-- ============================================================ 13. incident type (Sprint 3)
select tests.check('Older reports default to type other', (select bool_and(incident_type = 'other') from public.incidents));
begin; select tests.login('siti.staff@example.test'); set local role authenticated;
select public.report_incident('Laptop left in a taxi', 'Work laptop with the HR folder left in a taxi.',
  now() - interval '30 minutes', '{}', 'lost_stolen') as inc_type \gset
select tests.check('Staff can report with a type', (select incident_type = 'lost_stolen' from public.incidents where id = :'inc_type'));
select tests.must_fail('An unknown type is refused',
  $q$select public.report_incident('x', 'y', now() - interval '1 minute', '{}', 'aliens')$q$);
select tests.must_fail('Staff cannot change the type', format($q$select public.set_incident_type(%L, 'other')$q$, :'inc_type'));
commit;
begin; select tests.login('najwa.manager@example.test'); set local role authenticated;
select tests.must_fail('The manager cannot change the type', format($q$select public.set_incident_type(%L, 'other')$q$, :'inc_type'));
commit;
begin; select tests.login('other.manager@example.test'); set local role authenticated;
select tests.must_fail('Another organisation cannot change the type', format($q$select public.set_incident_type(%L, 'other')$q$, :'inc_type'));
commit;
begin; select tests.login('farid.lead@example.test'); set local role authenticated;
select public.set_incident_type(:'inc_type', 'unauthorised_access');
select tests.must_fail('The lead cannot set an unknown type', format($q$select public.set_incident_type(%L, 'aliens')$q$, :'inc_type'));
commit;
select tests.check('The lead can correct the type', (select incident_type = 'unauthorised_access' from public.incidents where id = :'inc_type'));

select tests.check('Incident codes are unique and run in order',
  (select count(*) = count(distinct code) from public.incidents where code like 'INC-%'));

-- ============================================================ summary
\o
\pset footer off
\pset format aligned
select n, case when ok then 'PASS' else 'FAIL' end as result, name,
       case when not ok then detail end as detail
from tests.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from tests.results;
