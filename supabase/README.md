# Database (Supabase / PostgreSQL)

## Migrations (run in order)
| File | What it does |
|---|---|
| `..._01_tables.sql` | 17 tables (the 16 in the proposal + `invitations`) |
| `..._02_rls.sql` | Row-level security, following proposal Table 23 |
| `..._03_integrity_and_audit.sql` | Append-only tables, 2-year retention lock, forward-only status, inventory versions, audit log |
| `..._04_criteria_deadlines.sql` | The 6 notification criteria, encryption helpers, deadline engine |
| `..._05_rpcs.sql` | Every action the app calls (invite, report, assess, decide, approve, record sent, close) |
| `..._06_alerts.sql` | 24 h / 6 h / overdue alerts, run every 5 minutes by pg_cron |
| `..._07_hardening.sql` | Takes back the access PostgreSQL and Supabase give every new function by default, then grants only what the RLS rules need |
| `..._08_rls_perf_and_fk_indexes.sql` | Same RLS rules written so `auth.uid()` runs once per query, and indexes on every foreign key |
| `..._09_realtime.sql` | Publishes `alerts` and `audit_log` to Supabase Realtime for live updates; RLS still decides who receives each event |
| `..._10_update_my_name.sql` | `update_my_name`: a signed-in person changes only their own display name (2 to 100 characters). Profiles still have no UPDATE policy |
| `..._11_inventory_save.sql` | `save_data_set` saves a data set and its field list in one step, so one save makes one version (none if nothing changed); refuses field names that look like real data (IC, phone, email). `set_data_set_status` archives or restores. Both run as the caller, so RLS still decides who can write |

## Changes from the proposal's data dictionary
1. **New `invitations` table.** A manager invites an email, and the role comes from the invitation. A Google account that wasn't invited sees nothing.
2. **`decisions`**: more than one row per incident is allowed, and the newest one counts. Rows are still append-only. Each row also stores what the rules suggested.
3. **Field categories**: `identity` means ID numbers only (IC, passport). Full name is `other`.
4. **`deadlines.status`** has a `not_required` value, plus a `provisional` flag for dates that depend on a notice not yet sent.
5. **`incident_data_sets`** has its own `id`, so the audit log can refer to it.
6. **Deleting incidents**: blocked while open, and blocked until `retain_until`.
7. **`incidents.delay_reason`**: required when the Commissioner is notified after 72 hours.
Also: `exposed_fields.sensitive_snapshot`, `criteria.method` and `criteria.source_ref`, `notifications.status` and `review_note`, `alerts.deadline_id`, `incidents.followup_done_at`.

## Before deploying
- Add a Vault secret named `pdpa_enc_key`, made from a long random string.
- Create the organisation and invite the first manager with the service role. See `tests/01_fixtures.sql` for the pattern.
- Supabase gives new public functions and tables to `anon` by default. Every new migration must revoke that again, the way migrations 02 and 05 do.

## Testing locally
`tests/run_local.sh` (also `npm run db:test`) rebuilds a throwaway local database, applies every migration and runs `tests/02_attack_suite.sql`: 142 checks covering the RLS attack tests for each role, the full incident lifecycle, the 10 assessment scenarios, the 20 deadline times and the inventory saves. It needs PostgreSQL 16 listening on `/tmp`, port 54329 (change with `PGHOST` / `PGPORT`). The `tests/` files are for local testing only and must never be run on Supabase.

Last full run: 24 Nov 2026, migrations 01 to 11, **142 passed, 0 failed**.

## Live project
- Supabase project `pdpa-tracker` (ref `tfflrmmmtgikhakqcgiy`), region ap-southeast-1 (Singapore), created 17 Nov 2026.
- Migrations 01 to 07 applied on 17 Nov 2026; migrations 08 and 09 on 23 Nov 2026; migrations 10 and 11 on 24 Nov 2026. Vault secret `pdpa_enc_key` created inside the database (the value was never printed).
- Security advisor: 23 "SECURITY DEFINER callable by authenticated" warnings. These are intended: they are the app's RPCs, and each one checks the caller's role (checked 23 Nov 2026). "Leaked password protection" is a paid feature and stops mattering once only Google sign-in is used.
- Performance advisor: clear since migration 08, apart from "unused index" notes, which are expected while there is little data.
