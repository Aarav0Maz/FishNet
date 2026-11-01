-- Optional party code: people who set one only see (and are suggested) others in the same party. No code = everyone, as before.
alter table public.profiles add column party text check (party is null or party ~ '^[a-z0-9-]{2,24}$');
create index profiles_party_idx on public.profiles (party) where party is not null;

create or replace function public.discover_page(p_limit int default 10, p_offset int default 0)
returns table (user_id uuid, name text, title text, company text, bio text, valuation text, template text, hue int,
               skills text[], interests text[], goals text[], score int)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); mp profiles;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select * into mp from profiles where id = me;
  if not found then raise exception 'profile required'; end if;
  return query
  select p.id, ps.name, ps.title, ps.company, ps.bio, ps.valuation, ps.template, ps.hue, p.skills, p.interests, p.goals,
         (3 * _overlap(mp.interests, p.interests) + 2 * _overlap(mp.skills, p.interests) + 2 * _overlap(mp.interests, p.skills) + _overlap(mp.goals, p.goals))::int as score
  from profiles p join personas ps on ps.user_id = p.id
  where p.id <> me and p.discoverable
    and (mp.party is null or p.party = mp.party)
    and not exists (select 1 from swipes s where s.swiper = me and s.target = p.id)
    and not exists (select 1 from connections c where c.user_a = least(me, p.id) and c.user_b = greatest(me, p.id))
  order by 12 desc, p.id
  limit least(greatest(p_limit, 1), 30) offset greatest(p_offset, 0);
end $$;
