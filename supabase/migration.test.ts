import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

// Runs the real migration on an in-process Postgres with a stubbed Supabase auth layer, as the `authenticated` role.
const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'
const D = '00000000-0000-0000-0000-00000000000d'
let db: PGlite

const as = async (uid: string | null) => {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ''])
  await db.exec(uid ? 'set role authenticated' : 'set role anon')
}
const rpc = async <T = unknown>(uid: string, sql: string, params: unknown[] = []) => { await as(uid); return (await db.query<T>(sql, params)).rows }
const swipe = async (uid: string, target: string, dir = 'like') => (await rpc<{ swipe: { matched: boolean } }>(uid, 'select swipe($1,$2)', [target, dir]))[0].swipe.matched

async function signup(id: string, name: string, tags: [string[], string[], string[]]) {
  await db.exec('reset role')
  await db.query('insert into auth.users(id) values ($1)', [id])
  await as(id)
  await db.query('insert into profiles(id,skills,interests,goals) values ($1,$2,$3,$4)', [id, tags[0], tags[1], tags[2]])
  await db.query('insert into personas(user_id,name,title,company) values ($1,$2,$3,$4)', [id, `${name} Persona`, 'CEO', 'Fish Inc'])
  await db.query('insert into private_identity(user_id,real_name,role,linkedin_url) values ($1,$2,$3,$4)', [id, `${name} Real`, 'Student', 'https://linkedin.com/in/x'])
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated; create role service_role;
    grant usage on schema public, auth to anon, authenticated, service_role; grant execute on function auth.uid() to anon, authenticated;
    create publication supabase_realtime;`)
  await db.exec(readFileSync(new URL('./migrations/0001_fishnet.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0002_jobs.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0003_messages.sql', import.meta.url), 'utf8'))
  await db.exec('grant usage on schema public to anon, authenticated, service_role')
  await signup(A, 'A', [['design'], ['ai', 'climate'], ['cofounder']])
  await signup(B, 'B', [['ai'], ['design'], ['cofounder']])
  await signup(C, 'C', [[], ['gaming'], []])
  await signup(D, 'D', [[], ['ai'], []])
})

describe('FishNet database', () => {
  it('discover excludes self, orders by deterministic score', async () => {
    const rows = await rpc<{ user_id: string; score: number }>(A, 'select * from discover_page(10,0)')
    expect(rows.map((r) => r.user_id)).not.toContain(A)
    expect(rows[0].user_id).toBe(B)
    expect(rows[0].score).toBe(3 * 0 + 2 * 1 + 2 * 1 + 1) // skills∩interests both ways + goal
  })
  it('one-way like creates no connection', async () => {
    expect(await swipe(A, B)).toBe(false)
    expect((await rpc<{ n: number }>(A, 'select count(*)::int n from connections'))[0].n).toBe(0)
  })
  it('mutual like creates exactly one connection and notifications, idempotently', async () => {
    expect(await swipe(B, A)).toBe(true)
    await swipe(B, A); await swipe(A, B)
    await as(A)
    expect((await db.query<{ n: number }>('select count(*)::int n from connections')).rows[0].n).toBe(1)
    expect((await db.query<{ n: number }>("select count(*)::int n from notifications where kind='match'")).rows[0].n).toBe(1)
  })
  it('swiped / connected users leave discovery', async () => {
    const rows = await rpc<{ user_id: string }>(A, 'select * from discover_page(10,0)')
    expect(rows.map((r) => r.user_id)).not.toContain(B)
  })
  it('rejects self-swipe and unauthenticated calls', async () => {
    await expect(swipe(A, A)).rejects.toThrow()
    await as(null)
    await expect(db.query('select swipe($1,$2)', [A, 'like'])).rejects.toThrow()
  })
  it('private identity is not readable by others via tables', async () => {
    await as(A)
    expect((await db.query('select * from private_identity where user_id=$1', [B])).rows).toHaveLength(0)
    expect((await db.query('select * from private_identity where user_id=$1', [A])).rows).toHaveLength(1)
    await expect(db.query('insert into connections(user_a,user_b) values ($1,$2)', [A, C])).rejects.toThrow()
    await expect(db.query('insert into swipes(swiper,target,direction) values ($1,$2,$3)', [A, C, 'like'])).rejects.toThrow()
  })
  it('graph is bounded to connections and exposes no real names before consent', async () => {
    await swipe(B, C); await swipe(C, B) // B–C connected, so A–B–C
    const g = (await rpc<{ get_graph: { nodes: { id: string; degree: number; revealedName: string | null }[]; edges: string[][] } }>(A, 'select get_graph()'))[0].get_graph
    expect(g.nodes.map((n) => [n.id, n.degree]).sort()).toEqual([[A, 0], [B, 1], [C, 2]].sort())
    expect(g.edges).toHaveLength(2)
    expect(g.nodes.every((n) => !n.revealedName)).toBe(true)
  })
  it('introduction needs intermediary then target approval, and respects routes', async () => {
    await expect(rpc(A, 'select request_intro($1,$2,$3)', [B, D, ''])).rejects.toThrow() // B not connected to D
    await expect(rpc(A, 'select request_intro($1,$2,$3)', [C, B, ''])).rejects.toThrow() // A not connected to C
    const id = (await rpc<{ request_intro: string }>(A, 'select request_intro($1,$2,$3)', [B, C, 'hi']))[0].request_intro
    await expect(rpc(C, 'select respond_intro($1,true)', [id])).rejects.toThrow() // target can't skip the intermediary
    await expect(rpc(A, 'select respond_intro($1,true)', [id])).rejects.toThrow() // requester can't self-approve
    await rpc(B, 'select respond_intro($1,true)', [id])
    expect((await rpc<{ status: string }>(A, 'select status from intro_requests where id=$1', [id]))[0].status).toBe('pending_target')
    await rpc(C, 'select respond_intro($1,true)', [id])
    expect((await rpc<{ status: string }>(A, 'select status from intro_requests where id=$1', [id]))[0].status).toBe('completed')
    const conn = (await rpc<{ n: number }>(A, 'select count(*)::int n from connections'))[0].n
    expect(conn).toBe(1) // A still only sees A–B: an introduction does not create a connection
  })
  it('reveal needs both consents; identity visible only then; withdrawal revokes', async () => {
    const view = async () => (await rpc<{ get_connections: { otherId: string; reveal: string; identity: { name: string } | null }[] }>(A, 'select get_connections()'))[0].get_connections.find((c) => c.otherId === B)!
    await expect(rpc(A, 'select set_reveal($1,true)', [C])).rejects.toThrow() // not connected
    await rpc(A, 'select set_reveal($1,true)', [B])
    expect(await view()).toMatchObject({ reveal: 'requested_by_me', identity: null })
    const bView = (await rpc<{ get_connections: { reveal: string; identity: unknown }[] }>(B, 'select get_connections()'))[0].get_connections.find((c) => (c as unknown as { otherId: string }).otherId === A)!
    expect(bView).toMatchObject({ reveal: 'requested_of_me', identity: null })
    await rpc(B, 'select set_reveal($1,true)', [A])
    expect(await view()).toMatchObject({ reveal: 'revealed', identity: { name: 'B Real' } })
    const g = (await rpc<{ get_graph: { nodes: { id: string; revealedName: string | null }[] } }>(A, 'select get_graph()'))[0].get_graph
    expect(g.nodes.find((n) => n.id === B)!.revealedName).toBe('B Real')
    expect(g.nodes.find((n) => n.id === C)!.revealedName).toBeNull()
    await rpc(B, 'select set_reveal($1,false)', [A])
    expect(await view()).toMatchObject({ reveal: 'none', identity: null })
  })
  it('users only read their own notifications', async () => {
    await as(D)
    expect((await db.query('select * from notifications')).rows).toHaveLength(0)
  })
})

describe('Render Workflows job functions', () => {
  const asService = async () => { await db.exec('reset role'); await db.exec('set role service_role') }
  it('are not callable by signed-in users', async () => {
    await as(A)
    await expect(db.query('select jobs_suggest_for($1)', [A])).rejects.toThrow()
    await expect(db.query('select jobs_expire_stale_intros(7)')).rejects.toThrow()
  })
  it('suggest: counts unseen relevant people and writes a single unread digest', async () => {
    await asService()
    const n = (await db.query<{ jobs_suggest_for: number }>('select jobs_suggest_for($1)', [D])).rows[0].jobs_suggest_for
    expect(n).toBeGreaterThanOrEqual(1)
    await db.query('select jobs_suggest_for($1)', [D]) // idempotent while unread
    await as(D)
    expect((await db.query<{ n: number }>("select count(*)::int n from notifications where kind='digest'")).rows[0].n).toBe(1)
  })
  it('expire: only old pending intros are expired and the requester is told', async () => {
    await db.exec('reset role')
    await db.query("update intro_requests set status='pending_via', created_at = now() - interval '10 days'")
    await db.query("insert into intro_requests(requester,via,target,status) values ($1,$2,$3,'pending_via')", [C, B, A])
    await asService()
    const ids = (await db.query('select jobs_expire_stale_intros(7)')).rows
    expect(ids).toHaveLength(1)
    await db.exec('reset role')
    const st = (await db.query<{ status: string }>('select status from intro_requests order by created_at')).rows.map((r) => r.status)
    expect(st).toEqual(['expired', 'pending_via'])
  })
})

describe('Masked chat', () => {
  it('matched users can exchange messages; order and ownership are right', async () => {
    await rpc(A, 'select send_message($1,$2)', [B, 'hello from A'])
    await rpc(B, 'select send_message($1,$2)', [A, 'hello back'])
    const a = (await rpc<{ get_messages: { mine: boolean; body: string }[] }>(A, 'select get_messages($1)', [B]))[0].get_messages
    expect(a.map((m) => [m.mine, m.body])).toEqual([[true, 'hello from A'], [false, 'hello back']])
  })
  it('sends one unread notification per sender, not one per message', async () => {
    await rpc(A, 'select send_message($1,$2)', [B, 'again'])
    const n = (await rpc<{ n: number }>(B, "select count(*)::int n from notifications where kind='message'"))[0].n
    expect(n).toBe(1)
  })
  it('outsiders cannot read or send, and empty messages are rejected', async () => {
    expect((await rpc(D, 'select * from messages')).length).toBe(0)
    await expect(rpc(D, 'select get_messages($1)', [A])).rejects.toThrow()
    await expect(rpc(D, 'select send_message($1,$2)', [A, 'sneaky'])).rejects.toThrow()
    await expect(rpc(A, 'select send_message($1,$2)', [B, '   '])).rejects.toThrow()
  })
  it('rate limits bursts', async () => {
    await expect((async () => { for (let i = 0; i < 40; i++) await rpc(A, 'select send_message($1,$2)', [B, `spam ${i}`]) })()).rejects.toThrow(/slow down/)
  })
})
