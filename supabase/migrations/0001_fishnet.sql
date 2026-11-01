-- FishNet schema. Apply in the Supabase SQL editor (or `supabase db push`).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  discoverable boolean not null default true,
  show_in_graph boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tag_limits check (cardinality(skills) <= 12 and cardinality(interests) <= 12 and cardinality(goals) <= 12)
);

create table public.personas (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  template text not null default 'visionary',
  name text not null check (char_length(name) between 1 and 60),
  title text not null check (char_length(title) <= 80),
  company text not null check (char_length(company) <= 80),
  bio text not null default '' check (char_length(bio) <= 280),
  valuation text not null default '' check (char_length(valuation) <= 30),
  hue int not null default 270 check (hue between 0 and 360)
);

-- Real identity. Never readable by anyone but the owner, except through get_connections() after mutual consent.
create table public.private_identity (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  real_name text not null check (char_length(real_name) between 1 and 80),
  role text not null default '' check (char_length(role) <= 120),
  bio text not null default '' check (char_length(bio) <= 500),
  linkedin_url text not null default '' check (char_length(linkedin_url) <= 200)
);

create table public.swipes (
  swiper uuid not null references public.profiles(id) on delete cascade,
  target uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('like','pass')),
  created_at timestamptz not null default now(),
  primary key (swiper, target),
  check (swiper <> target)
);
create index swipes_target_idx on public.swipes (target, direction);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index connections_b_idx on public.connections (user_b);

create table public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references public.profiles(id) on delete cascade,
  via uuid not null references public.profiles(id) on delete cascade,
  target uuid not null references public.profiles(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 280),
  status text not null default 'pending_via' check (status in ('pending_via','pending_target','completed','declined')),
  created_at timestamptz not null default now(),
  check (requester <> via and via <> target and requester <> target)
);
create unique index intro_open_uniq on public.intro_requests (requester, via, target) where status in ('pending_via','pending_target');
create index intro_via_idx on public.intro_requests (via);
create index intro_target_idx on public.intro_requests (target);

create table public.reveal_consent (
  connection_id uuid not null references public.connections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (connection_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  actor_name text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.personas enable row level security;
alter table public.private_identity enable row level security;
alter table public.swipes enable row level security;
alter table public.connections enable row level security;
alter table public.intro_requests enable row level security;
alter table public.reveal_consent enable row level security;
alter table public.notifications enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update on public.profiles, public.personas, public.private_identity to authenticated;
grant select on public.swipes, public.connections, public.intro_requests, public.reveal_consent to authenticated;
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or discoverable);
create policy profiles_ins on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy personas_read on public.personas for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = user_id and p.discoverable));
create policy personas_ins on public.personas for insert to authenticated with check (user_id = auth.uid());
create policy personas_upd on public.personas for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy identity_own_read on public.private_identity for select to authenticated using (user_id = auth.uid());
create policy identity_ins on public.private_identity for insert to authenticated with check (user_id = auth.uid());
create policy identity_upd on public.private_identity for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy swipes_own on public.swipes for select to authenticated using (swiper = auth.uid());
create policy conn_own on public.connections for select to authenticated using (auth.uid() in (user_a, user_b));
create policy intro_party on public.intro_requests for select to authenticated using (auth.uid() in (requester, via, target));
create policy consent_party on public.reveal_consent for select to authenticated using (user_id = auth.uid());
create policy notif_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_mark on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- helpers ----------
create or replace function public._persona_name(p_id uuid) returns text language sql stable security definer set search_path = public as $$
  select name from personas where user_id = p_id
$$;
revoke all on function public._persona_name(uuid) from public, anon, authenticated;

create or replace function public._connected(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from connections where user_a = least(a, b) and user_b = greatest(a, b))
$$;
revoke all on function public._connected(uuid, uuid) from public, anon, authenticated;

create or replace function public._notify(p_user uuid, p_kind text, p_actor text) returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, actor_name) values (p_user, p_kind, p_actor)
$$;
revoke all on function public._notify(uuid, text, text) from public, anon, authenticated;

create or replace function public._overlap(a text[], b text[]) returns int language sql immutable as $$
  select count(*)::int from (select distinct lower(btrim(x)) as v from unnest(a) as x) p join (select distinct lower(btrim(y)) as v from unnest(b) as y) q using (v)
$$;

-- ---------- discovery (deterministic score, mirrors src/lib/graph.ts matchScore) ----------
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
    and not exists (select 1 from swipes s where s.swiper = me and s.target = p.id)
    and not exists (select 1 from connections c where c.user_a = least(me, p.id) and c.user_b = greatest(me, p.id))
  order by 12 desc, p.id
  limit least(greatest(p_limit, 1), 30) offset greatest(p_offset, 0);
end $$;

-- ---------- atomic swipe + mutual match ----------
create or replace function public.swipe(p_target uuid, p_dir text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); conn uuid; matched boolean := false;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_dir not in ('like','pass') then raise exception 'invalid direction'; end if;
  if p_target = me then raise exception 'cannot swipe on yourself'; end if;
  if not exists (select 1 from profiles where id = p_target and discoverable) then raise exception 'target unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(me, p_target)::text || greatest(me, p_target)::text, 0));
  insert into swipes (swiper, target, direction) values (me, p_target, p_dir)
    on conflict (swiper, target) do update set direction = excluded.direction where swipes.direction = 'pass' and excluded.direction = 'like';
  if p_dir = 'like' and exists (select 1 from swipes where swiper = p_target and target = me and direction = 'like') then
    insert into connections (user_a, user_b) values (least(me, p_target), greatest(me, p_target))
      on conflict (user_a, user_b) do nothing returning id into conn;
    if conn is not null then
      matched := true;
      perform _notify(me, 'match', _persona_name(p_target));
      perform _notify(p_target, 'match', _persona_name(me));
    else
      matched := true;
    end if;
  end if;
  return jsonb_build_object('matched', matched);
end $$;

-- ---------- connections (+ reveal state, real identity only after both consent) ----------
create or replace function public.get_connections() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  return coalesce((
    select jsonb_agg(obj order by (obj->>'since') desc) from (
      select jsonb_build_object(
        'id', c.id, 'otherId', o.id, 'since', c.created_at,
        'persona', jsonb_build_object('template', ps.template, 'name', ps.name, 'title', ps.title, 'company', ps.company, 'bio', ps.bio, 'valuation', ps.valuation, 'hue', ps.hue),
        'tags', jsonb_build_object('skills', o.skills, 'interests', o.interests, 'goals', o.goals),
        'reveal', case
          when mine and theirs then 'revealed'
          when mine then 'requested_by_me'
          when theirs then 'requested_of_me'
          else 'none' end,
        'identity', case when mine and theirs then
          (select jsonb_build_object('name', pi.real_name, 'role', pi.role, 'bio', pi.bio, 'linkedin', pi.linkedin_url) from private_identity pi where pi.user_id = o.id)
          else null end
      ) as obj
      from connections c
      join profiles o on o.id = case when c.user_a = me then c.user_b else c.user_a end
      join personas ps on ps.user_id = o.id
      cross join lateral (
        select exists (select 1 from reveal_consent r where r.connection_id = c.id and r.user_id = me) as mine,
               exists (select 1 from reveal_consent r where r.connection_id = c.id and r.user_id = o.id) as theirs
      ) k
      where me in (c.user_a, c.user_b)
    ) q
  ), '[]'::jsonb);
end $$;

-- ---------- bounded subgraph: up to 3 hops, capped, privacy-filtered ----------
create or replace function public.get_graph() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); res jsonb;
begin
  if me is null then raise exception 'not authenticated'; end if;
  with recursive
  adj as (select user_a a, user_b b from connections union all select user_b, user_a from connections),
  l1 as (select b id from adj where a = me),
  l2 as (select distinct adj.b id from adj join l1 on adj.a = l1.id
         join profiles p on p.id = adj.b where adj.b <> me and adj.b not in (select id from l1) and p.show_in_graph limit 60),
  l3 as (select distinct adj.b id from adj join l2 on adj.a = l2.id
         join profiles p on p.id = adj.b where adj.b <> me and adj.b not in (select id from l1) and adj.b not in (select id from l2) and p.show_in_graph limit 60),
  nodes as (select me id, 0 deg union all select id, 1 from l1 union all select id, 2 from l2 union all select id, 3 from l3)
  select jsonb_build_object(
    'nodes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', n.id, 'degree', n.deg,
        'persona', jsonb_build_object('template', ps.template, 'name', ps.name, 'title', ps.title, 'company', ps.company, 'bio', ps.bio, 'valuation', ps.valuation, 'hue', ps.hue),
        'revealedName', (select pi.real_name from private_identity pi join connections c on c.user_a = least(me, n.id) and c.user_b = greatest(me, n.id)
                         where pi.user_id = n.id and n.deg = 1
                           and exists (select 1 from reveal_consent r where r.connection_id = c.id and r.user_id = me)
                           and exists (select 1 from reveal_consent r where r.connection_id = c.id and r.user_id = n.id)))
      ) from nodes n join personas ps on ps.user_id = n.id), '[]'::jsonb),
    'edges', coalesce((select jsonb_agg(jsonb_build_array(c.user_a, c.user_b)) from connections c
        where c.user_a in (select id from nodes) and c.user_b in (select id from nodes)), '[]'::jsonb)
  ) into res;
  return res;
end $$;

-- ---------- introductions ----------
create or replace function public.request_intro(p_via uuid, p_target uuid, p_note text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if me in (p_via, p_target) or p_via = p_target then raise exception 'invalid introduction'; end if;
  if not _connected(me, p_via) then raise exception 'you are not connected to the intermediary'; end if;
  if not _connected(p_via, p_target) then raise exception 'intermediary is not connected to the target'; end if;
  if _connected(me, p_target) then raise exception 'already connected'; end if;
  insert into intro_requests (requester, via, target, note) values (me, p_via, p_target, left(coalesce(p_note, ''), 280)) returning id into rid;
  perform _notify(p_via, 'intro_request', _persona_name(me));
  return rid;
end $$;

create or replace function public.respond_intro(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r intro_requests;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select * into r from intro_requests where id = p_id for update;
  if not found then raise exception 'not found'; end if;
  if r.status = 'pending_via' and r.via = me then
    if p_accept then
      update intro_requests set status = 'pending_target' where id = p_id;
      perform _notify(r.target, 'intro_request', _persona_name(r.requester));
      perform _notify(r.requester, 'intro_forwarded', _persona_name(me));
    else
      update intro_requests set status = 'declined' where id = p_id;
      perform _notify(r.requester, 'intro_declined', _persona_name(me));
    end if;
  elsif r.status = 'pending_target' and r.target = me then
    if p_accept then
      update intro_requests set status = 'completed' where id = p_id;
      perform _notify(r.requester, 'intro_accepted', _persona_name(me));
      perform _notify(r.via, 'intro_accepted', _persona_name(me));
    else
      update intro_requests set status = 'declined' where id = p_id;
      perform _notify(r.requester, 'intro_declined', _persona_name(me));
    end if;
  else
    raise exception 'not allowed';
  end if;
end $$;

create or replace function public.get_intros() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'requesterId', r.requester, 'viaId', r.via, 'targetId', r.target, 'note', r.note, 'status', r.status, 'createdAt', r.created_at,
      'names', jsonb_build_object('requester', _persona_name(r.requester), 'via', _persona_name(r.via), 'target', _persona_name(r.target)),
      'myRole', case when r.requester = me then 'requester' when r.via = me then 'via' else 'target' end
    ) order by r.created_at desc)
    from intro_requests r where me in (r.requester, r.via, r.target)
      and not (r.target = me and r.status = 'pending_via')), '[]'::jsonb);
end $$;

-- ---------- reality reveal: both users must consent ----------
create or replace function public.set_reveal(p_other uuid, p_consent boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid; theirs boolean;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select id into cid from connections where user_a = least(me, p_other) and user_b = greatest(me, p_other);
  if cid is null then raise exception 'not connected'; end if;
  if p_consent then
    if not exists (select 1 from private_identity where user_id = me) then raise exception 'complete your real profile first'; end if;
    insert into reveal_consent (connection_id, user_id) values (cid, me) on conflict do nothing;
    select exists (select 1 from reveal_consent where connection_id = cid and user_id = p_other) into theirs;
    perform _notify(p_other, case when theirs then 'reveal_approved' else 'reveal_request' end, _persona_name(me));
    if theirs then perform _notify(me, 'reveal_approved', _persona_name(p_other)); end if;
  else
    delete from reveal_consent where connection_id = cid;  -- either side can withdraw; revokes access immediately
  end if;
end $$;

grant execute on function public.discover_page(int, int), public.swipe(uuid, text), public.get_connections(), public.get_graph(),
  public.request_intro(uuid, uuid, text), public.respond_intro(uuid, boolean), public.get_intros(), public.set_reveal(uuid, boolean) to authenticated;
revoke execute on function public.discover_page(int, int), public.swipe(uuid, text), public.get_connections(), public.get_graph(),
  public.request_intro(uuid, uuid, text), public.respond_intro(uuid, boolean), public.get_intros(), public.set_reveal(uuid, boolean) from anon, public;

alter publication supabase_realtime add table public.notifications;
