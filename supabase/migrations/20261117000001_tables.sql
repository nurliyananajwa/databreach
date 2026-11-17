-- PDPA Breach Response Tracker: tables (Sprint 1)
-- 17 tables: the 16 in the proposal plus `invitations` (design fix 1).
-- The system stores METADATA about personal data only, never the data itself.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------- access
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(120) not null,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete restrict,
  org_id      uuid not null references public.organisations(id),
  full_name   varchar(100) not null,
  email       varchar(255) not null unique,
  role        varchar(20)  not null check (role in ('staff','dp_lead','manager')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Design fix 1: a manager invites an email; the role comes from the
-- invitation, never from the user. Claimed on first Google sign-in.
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id),
  email        varchar(255) not null,
  role         varchar(20)  not null check (role in ('staff','dp_lead','manager')),
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  check (email = lower(email))
);
-- only one open invitation per email
create unique index invitations_one_open_per_email
  on public.invitations (email) where accepted_at is null and revoked_at is null;

-- ---------------------------------------------------------------- inventory
create table public.data_sets (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id),
  code                varchar(12)  not null,
  name                varchar(120) not null,
  storage_location    varchar(200) not null,
  access_description  text,
  purpose             text not null,
  retention_period    varchar(120),
  owner_id            uuid references public.profiles(id),
  processor_name      varchar(120),
  approx_records      integer check (approx_records >= 0),
  status              varchar(10) not null default 'active' check (status in ('active','archived')),
  version_no          integer not null default 1,
  updated_at          timestamptz not null default now(),
  unique (org_id, code)
);

create table public.data_set_versions (
  id           uuid primary key default gen_random_uuid(),
  data_set_id  uuid not null references public.data_sets(id),
  version_no   integer not null,
  snapshot     jsonb not null,
  changed_by   uuid references public.profiles(id),
  changed_at   timestamptz not null default now(),
  unique (data_set_id, version_no)
);

-- Category guide (design fix 3):
--   identity  = government ID numbers only (IC/MyKad, passport, birth cert no.)
--   contact   = phone, email, home address
--   financial = bank account, card, salary, credit details
--   sensitive = health, religion, politics, offences, biometric
--   other     = everything else, INCLUDING full name
create table public.data_fields (
  id            uuid primary key default gen_random_uuid(),
  data_set_id   uuid not null references public.data_sets(id),
  field_name    varchar(80) not null,
  category      varchar(20) not null check (category in ('identity','contact','financial','sensitive','other')),
  is_sensitive  boolean not null default false,
  unique (data_set_id, field_name),
  check (category <> 'sensitive' or is_sensitive)
);

-- ---------------------------------------------------------------- incidents
create table public.incidents (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organisations(id),
  code                 varchar(12)  not null,
  title                varchar(160) not null,
  description_enc      bytea not null,
  reported_by          uuid not null references public.profiles(id),
  reported_at          timestamptz not null default now(),
  aware_at             timestamptz not null,
  status               varchar(12) not null default 'reported'
                       check (status in ('reported','assessing','decided','notified','follow_up','closed')),
  individuals_affected integer check (individuals_affected >= 0),
  containment_enc      bytea,
  delay_reason         text,          -- design fix 7: required if Commissioner notified after 72 h
  followup_done_at     timestamptz,   -- lead confirms no more phased information is needed
  closed_at            timestamptz,
  retain_until         date,
  unique (org_id, code),
  check (aware_at <= reported_at),
  check ((status = 'closed') = (closed_at is not null))
);

-- Design fix 5: single uuid id so the audit log can reference it.
create table public.incident_data_sets (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references public.incidents(id) on delete cascade,
  data_set_id  uuid not null references public.data_sets(id),
  unique (incident_id, data_set_id)
);

create table public.exposed_fields (
  id                   uuid primary key default gen_random_uuid(),
  incident_id          uuid not null references public.incidents(id) on delete cascade,
  data_field_id        uuid references public.data_fields(id) on delete set null,
  field_name_snapshot  varchar(80) not null,
  category_snapshot    varchar(20) not null,
  sensitive_snapshot   boolean not null,
  confirmed_by         uuid not null references public.profiles(id),
  confirmed_at         timestamptz not null default now()
);

create table public.criteria (
  id                 uuid primary key default gen_random_uuid(),
  code               varchar(30) not null,
  guideline_version  varchar(20) not null,
  kind               varchar(10) not null check (kind in ('harm','scale')),
  method             varchar(10) not null check (method in ('auto','judgement')),
  description        text not null,
  effect             varchar(30) not null check (effect in ('commissioner','commissioner_and_subjects')),
  source_ref         text not null,
  unique (code, guideline_version)
);

create table public.assessments (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references public.incidents(id) on delete cascade,
  run_no        integer not null,
  criterion_id  uuid not null references public.criteria(id),
  result        varchar(16) not null check (result in ('met','not_met','needs_judgement')),
  input_used    jsonb,
  reason        text not null,
  assessed_by   uuid references public.profiles(id),
  assessed_at   timestamptz not null default now(),
  unique (incident_id, run_no, criterion_id)
);

-- Design fix 2: many decisions per incident, append-only; the newest counts.
create table public.decisions (
  id                      uuid primary key default gen_random_uuid(),
  incident_id             uuid not null references public.incidents(id) on delete cascade,
  assessment_run          integer not null,
  suggested_commissioner  boolean not null,
  suggested_subjects      boolean not null,
  notify_commissioner     boolean not null,
  notify_subjects         boolean not null,
  reason                  text not null check (length(trim(reason)) >= 10),
  decided_by              uuid not null references public.profiles(id),
  decided_at              timestamptz not null default clock_timestamp(),
  check (notify_commissioner or not notify_subjects)  -- individuals are only told after the Commissioner
);

-- ---------------------------------------------------------------- response
create table public.deadlines (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references public.incidents(id) on delete cascade,
  type         varchar(20) not null check (type in ('commissioner_72h','subjects_7d','followup_30d')),
  due_at       timestamptz not null,
  provisional  boolean not null default false,
  met_at       timestamptz,
  status       varchar(12) not null default 'open'
               check (status in ('open','met','missed','not_required')),  -- design fix 4
  unique (incident_id, type)
);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references public.incidents(id) on delete cascade,
  title         varchar(160) not null,
  assignee_id   uuid references public.profiles(id),
  due_at        timestamptz,
  completed_at  timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references public.incidents(id) on delete cascade,
  recipient     varchar(20) not null check (recipient in ('commissioner','data_subjects','commissioner_update')),
  status        varchar(16) not null default 'draft'
                check (status in ('draft','pending_approval','approved','returned','sent')),
  draft         jsonb not null default '{}'::jsonb,
  review_note   text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  approved_by   uuid references public.profiles(id),
  approved_at   timestamptz,
  sent_at       timestamptz,
  sent_by       uuid references public.profiles(id),
  method        varchar(30),
  reference_no  varchar(40),
  check (status <> 'sent' or (sent_at is not null and method is not null))
);

create table public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  incident_id  uuid not null references public.incidents(id) on delete cascade,
  deadline_id  uuid references public.deadlines(id) on delete cascade,
  message      varchar(200) not null,
  level        varchar(10) not null check (level in ('info','warning','overdue')),
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  unique (deadline_id, user_id, level)
);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references public.organisations(id),
  actor_id    uuid,
  table_name  varchar(40) not null,
  record_id   uuid not null,
  action      varchar(10) not null check (action in ('insert','update','delete')),
  details     jsonb,
  created_at  timestamptz not null default clock_timestamp()
);

-- Helpful indexes for RLS lookups and the dashboard
create index on public.profiles (org_id);
create index on public.data_sets (org_id);
create index on public.data_fields (data_set_id);
create index on public.incidents (org_id, status);
create index on public.incidents (reported_by);
create index on public.exposed_fields (incident_id);
create index on public.assessments (incident_id, run_no);
create index on public.decisions (incident_id, decided_at desc);
create index on public.deadlines (status, due_at);
create index on public.tasks (incident_id);
create index on public.tasks (assignee_id);
create index on public.notifications (incident_id);
create index on public.alerts (user_id, read_at);
create index on public.audit_log (org_id, created_at desc);
