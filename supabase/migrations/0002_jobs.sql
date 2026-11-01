-- Background-job support for the Render Workflows service (workflows/). Callable only with the service_role key.
alter table public.intro_requests drop constraint intro_requests_status_check;
alter table public.intro_requests add constraint intro_requests_status_check
  check (status in ('pending_via','pending_target','completed','declined','expired'));

-- Expires introductions still waiting after p_days; notifies the requester. Returns the expired ids.
create or replace function public.jobs_expire_stale_intros(p_days int default 7) returns setof uuid
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    update intro_requests set status = 'expired'
    where status in ('pending_via','pending_target') and created_at < now() - make_interval(days => greatest(p_days, 0))
    returning id, requester, via
  loop
    perform _notify(r.requester, 'intro_expired', coalesce(_persona_name(r.via), ''));
    return next r.id;
  end loop;
end $$;

-- Writes one "people match your interests" digest alert for a user (none if nothing new, or one is already unread).
-- Same scoring as discover_page(). Returns how many suggestions were found.
create or replace function public.jobs_suggest_for(p_user uuid) returns int
language plpgsql security definer set search_path = public as $$
declare mp profiles; n int;
begin
  select * into mp from profiles where id = p_user;
  if not found then return 0; end if;
  select count(*)::int into n from profiles p join personas ps on ps.user_id = p.id
  where p.id <> p_user and p.discoverable
    and (3 * _overlap(mp.interests, p.interests) + 2 * _overlap(mp.skills, p.interests) + 2 * _overlap(mp.interests, p.skills) + _overlap(mp.goals, p.goals)) > 0
    and not exists (select 1 from swipes s where s.swiper = p_user and s.target = p.id)
    and not exists (select 1 from connections c where c.user_a = least(p_user, p.id) and c.user_b = greatest(p_user, p.id));
  if n > 0 and not exists (select 1 from notifications where user_id = p_user and kind = 'digest' and not read) then
    perform _notify(p_user, 'digest', n::text);
  end if;
  return n;
end $$;

revoke all on function public.jobs_expire_stale_intros(int), public.jobs_suggest_for(uuid) from public, anon, authenticated;
grant execute on function public.jobs_expire_stale_intros(int), public.jobs_suggest_for(uuid) to service_role;
