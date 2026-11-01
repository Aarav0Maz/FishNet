-- Masked chat between matched users. Writes only through send_message(); reads limited to the two participants by RLS.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_conn_idx on public.messages (connection_id, created_at);

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
create policy messages_party on public.messages for select to authenticated
  using (exists (select 1 from public.connections c where c.id = connection_id and auth.uid() in (c.user_a, c.user_b)));

create or replace function public.send_message(p_other uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid; mid uuid; actor text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then raise exception 'message must be 1 to 1000 characters'; end if;
  select id into cid from connections where user_a = least(me, p_other) and user_b = greatest(me, p_other);
  if cid is null then raise exception 'not connected'; end if;
  if (select count(*) from messages where sender = me and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'slow down: too many messages';
  end if;
  insert into messages (connection_id, sender, body) values (cid, me, btrim(p_body)) returning id into mid;
  actor := _persona_name(me);
  if not exists (select 1 from notifications where user_id = p_other and kind = 'message' and actor_name = actor and not read) then
    perform _notify(p_other, 'message', actor);
  end if;
  return mid;
end $$;

create or replace function public.get_messages(p_other uuid, p_limit int default 200) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select id into cid from connections where user_a = least(me, p_other) and user_b = greatest(me, p_other);
  if cid is null then raise exception 'not connected'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'mine', m.sender = me, 'body', m.body, 'createdAt', m.created_at) order by m.created_at)
    from (select * from messages where connection_id = cid order by created_at desc limit least(greatest(p_limit, 1), 500)) m), '[]'::jsonb);
end $$;

revoke execute on function public.send_message(uuid, text), public.get_messages(uuid, int) from public, anon;
grant execute on function public.send_message(uuid, text), public.get_messages(uuid, int) to authenticated;
alter publication supabase_realtime add table public.messages;
