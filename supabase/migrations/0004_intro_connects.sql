-- A completed introduction (requester asked, intermediary agreed, target accepted) now creates the connection,
-- so the requester and target can message and reveal. Replaces respond_intro from 0001.
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
      insert into connections (user_a, user_b) values (least(r.requester, r.target), greatest(r.requester, r.target))
        on conflict (user_a, user_b) do nothing;
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
