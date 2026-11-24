-- Settings > Profile: anyone signed in may change their OWN display name.
-- Nothing else on their profile: email comes from the invitation and sign-in,
-- role and active status are changed only by a manager (set_user_role /
-- set_user_active). Profiles have no UPDATE policy, so this function is the
-- only way in. The audit trigger on profiles records the change.

create function public.update_my_name(p_full_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_name text := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
begin
  if auth.uid() is null or private.my_org() is null then
    raise exception 'Not signed in' using errcode = '42501';  -- also blocks deactivated users
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Name must be 2 to 100 characters' using errcode = '22023';
  end if;
  update public.profiles set full_name = v_name where id = auth.uid();
end $$;

revoke all on function public.update_my_name(text) from public, anon;
grant execute on function public.update_my_name(text) to authenticated;
