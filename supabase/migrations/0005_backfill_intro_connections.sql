-- One-time backfill: introductions completed before 0004 never created their connection. Idempotent.
insert into public.connections (user_a, user_b)
select least(requester, target), greatest(requester, target) from public.intro_requests where status = 'completed'
on conflict (user_a, user_b) do nothing;
