-- LOCAL TESTING ONLY. Fictional business and fictional users.
-- (Real users join through Google sign-in + an invitation.)

insert into public.organisations (id, name) values
 ('00000000-0000-0000-0000-0000000000a1', 'Teras Payroll Solutions Sdn Bhd'),
 ('00000000-0000-0000-0000-0000000000b2', 'Harbour Logistics Sdn Bhd');

insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001', 'najwa.manager@example.test', '{"full_name":"Najwa (Manager)"}'),
 ('00000000-0000-0000-0000-000000000002', 'farid.lead@example.test',     '{"full_name":"Farid (DP Lead)"}'),
 ('00000000-0000-0000-0000-000000000003', 'siti.staff@example.test',     '{"full_name":"Siti (Staff)"}'),
 ('00000000-0000-0000-0000-000000000004', 'ahmad.staff@example.test',    '{"full_name":"Ahmad (Staff)"}'),
 ('00000000-0000-0000-0000-000000000005', 'other.manager@example.test',  '{"full_name":"Other Org Manager"}'),
 ('00000000-0000-0000-0000-000000000006', 'stranger@example.test',       '{"full_name":"Not Invited"}'),
 ('00000000-0000-0000-0000-000000000007', 'newlead@example.test',        '{"full_name":"Invited Lead"}');

-- first manager of each org is created by the administrator (service role)
insert into public.invitations (org_id, email, role) values
 ('00000000-0000-0000-0000-0000000000a1', 'najwa.manager@example.test', 'manager'),
 ('00000000-0000-0000-0000-0000000000a1', 'farid.lead@example.test',     'dp_lead'),
 ('00000000-0000-0000-0000-0000000000a1', 'siti.staff@example.test',     'staff'),
 ('00000000-0000-0000-0000-0000000000a1', 'ahmad.staff@example.test',    'staff'),
 ('00000000-0000-0000-0000-0000000000b2', 'other.manager@example.test',  'manager');

create schema tests;
grant usage on schema tests to authenticated, anon;
create table tests.results (n serial, name text, ok boolean, detail text);
grant insert, select on tests.results to authenticated, anon;
grant usage on sequence tests.results_n_seq to authenticated, anon;

-- become a user (call, then: set local role authenticated)
create function tests.login(p_email text) returns void language sql as $$
  select set_config('request.jwt.claims',
    coalesce((select jsonb_build_object('sub', id, 'email', email, 'role', 'authenticated')::text
              from auth.users where email = p_email), ''), true)
$$;
grant execute on function tests.login(text) to authenticated;

create function tests.check(p_name text, p_ok boolean, p_detail text default null) returns void
language sql as $$ insert into tests.results (name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail) $$;

-- passes if the statement raises an error
create function tests.must_fail(p_name text, p_sql text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    insert into tests.results (name, ok, detail) values (p_name, true, sqlerrm);
    return;
  end;
  insert into tests.results (name, ok, detail) values (p_name, false, 'statement succeeded');
end $$;

-- passes if the statement changes 0 rows or raises an error (RLS silently filters)
create function tests.must_not_change(p_name text, p_sql text) returns void language plpgsql as $$
declare n int;
begin
  begin
    execute p_sql;
    get diagnostics n = row_count;
  exception when others then
    insert into tests.results (name, ok, detail) values (p_name, true, sqlerrm);
    return;
  end;
  insert into tests.results (name, ok, detail) values (p_name, n = 0, n || ' rows changed');
end $$;

grant execute on all functions in schema tests to authenticated, anon;
