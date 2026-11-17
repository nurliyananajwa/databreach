-- Hardening: PostgreSQL lets PUBLIC execute every new function by default, and
-- Supabase gives new objects to `anon`. Take that back, then grant only what
-- RLS policies need. RPCs are security-definer, so they still work.

revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function
  private.my_role(), private.my_org(), private.has_role(text[]),
  private.incident_org(uuid), private.data_set_org(uuid),
  private.can_see_incident(uuid), private.is_lead_or_manager_of(uuid),
  private.incident_is_open(uuid)
to authenticated;

revoke all on public.deadline_status from anon, public;
grant select on public.deadline_status to authenticated;

-- every RPC: signed-in users only
revoke all on all functions in schema public from public, anon;

-- pure helpers called by triggers that run as the signed-in user
grant execute on function private.ds_flag(uuid), private.kl_date(timestamptz), private.status_rank(text)
to authenticated;
