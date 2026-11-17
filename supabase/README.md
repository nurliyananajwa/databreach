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
`tests/run_local.sh` rebuilds a throwaway local database and runs `tests/02_attack_suite.sql`. That covers the RLS attack tests, the full incident lifecycle, the 10 assessment scenarios and the 20 deadline times. The `tests/` files are for local testing only and must never be run on Supabase.
