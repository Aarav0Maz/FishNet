import { matchScore } from '../lib/graph'
import type { Candidate, Connection, DataSource, GraphData, IntroRequest, MyProfile, MyProfileInput, Notice, NoticeKind, RevealState } from '../types'
import { DEMO_EDGES, DEMO_START_CONNECTIONS, DEMO_USERS } from './demoSeed'

export const DEMO_ME = 'demo-me'
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
let uid = 0
const nid = (p: string) => `${p}-${++uid}`

/** In-memory demo world. Nothing is persisted and nothing touches Supabase; every "other side" action is simulated. */
export function createDemoSource(): DataSource {
  let me: MyProfile | null = null
  const byId = new Map(DEMO_USERS.map((u) => [u.id, u]))
  const edges: [string, string][] = DEMO_EDGES.map(([a, b]) => [DEMO_USERS[a].id, DEMO_USERS[b].id])
  for (const i of DEMO_START_CONNECTIONS) edges.push([DEMO_ME, DEMO_USERS[i].id])
  const swiped = new Set<string>()
  const reveal = new Map<string, RevealState>()
  let intros: IntroRequest[] = []
  let notices: Notice[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const notify = (kind: NoticeKind, name: string) => { notices = [{ id: nid('n'), kind, name, read: false, createdAt: new Date().toISOString(), simulated: true }, ...notices]; emit() }
  const nameOf = (id: string) => (id === DEMO_ME ? me?.persona.name ?? 'You' : byId.get(id)?.persona.name ?? 'Unknown')
  const connected = (a: string, b: string) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  const myConns = () => edges.filter(([a, b]) => a === DEMO_ME || b === DEMO_ME).map(([a, b]) => (a === DEMO_ME ? b : a))
  const later = (fn: () => void, ms: number) => setTimeout(fn, ms)

  // Deterministic stand-in for "they liked you back": even-numbered demo users do.
  const likesBack = (id: string) => Number(id.split('-')[1]) % 2 === 0

  return {
    kind: 'demo',
    async getMe() { return me },
    async saveMe(p: MyProfileInput) { await wait(); me = { id: DEMO_ME, ...p }; return me },
    async discover(offset, limit) {
      if (!me) return []
      const mine = me
      const cands: Candidate[] = DEMO_USERS.filter((u) => !swiped.has(u.id) && !connected(DEMO_ME, u.id))
        .map((u) => ({ id: u.id, persona: u.persona, tags: u.tags, score: matchScore(mine.tags, u.tags) }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      await wait(200)
      return cands.slice(offset, offset + limit)
    },
    async swipe(id, dir) {
      await wait(150)
      swiped.add(id)
      if (dir === 'like' && likesBack(id) && !connected(DEMO_ME, id)) {
        edges.push([DEMO_ME, id])
        notify('match', nameOf(id))
        return { matched: true }
      }
      return { matched: false }
    },
    async connections() {
      await wait(100)
      return myConns().map((oid): Connection => {
        const u = byId.get(oid)!
        const st = reveal.get(oid) ?? 'none'
        return { id: `c-${oid}`, otherId: oid, persona: u.persona, tags: u.tags, since: new Date().toISOString(), reveal: st, identity: st === 'revealed' ? u.real : undefined }
      })
    },
    async graph(): Promise<GraphData> {
      await wait(100)
      if (!me) return { nodes: [], edges: [] }
      const l1 = new Set(myConns())
      const deg = new Map<string, number>([[DEMO_ME, 0]])
      l1.forEach((i) => deg.set(i, 1))
      let frontier = [...l1]
      for (const d of [2, 3]) {
        const next: string[] = []
        for (const f of frontier) for (const [a, b] of edges) {
          const o = a === f ? b : b === f ? a : null
          if (o && !deg.has(o)) { deg.set(o, d); next.push(o) }
        }
        frontier = next
      }
      const nodes = [...deg].map(([id, degree]) => id === DEMO_ME
        ? { id, persona: me!.persona, degree }
        : { id, persona: byId.get(id)!.persona, degree, revealedName: reveal.get(id) === 'revealed' ? byId.get(id)!.real.name : undefined })
      return { nodes, edges: edges.filter(([a, b]) => deg.has(a) && deg.has(b)) }
    },
    async recommendations() {
      return (await this.discover(0, 5))
    },
    async intros() { await wait(80); return intros },
    async requestIntro(viaId, targetId, note) {
      await wait()
      if (!connected(DEMO_ME, viaId) || !connected(viaId, targetId)) throw new Error('Route is not made of confirmed connections')
      if (intros.some((i) => i.viaId === viaId && i.targetId === targetId && (i.status === 'pending_via' || i.status === 'pending_target'))) throw new Error('Request already open')
      const req: IntroRequest = { id: nid('i'), requesterId: DEMO_ME, viaId, targetId, note, status: 'pending_via', createdAt: new Date().toISOString(), names: { requester: nameOf(DEMO_ME), via: nameOf(viaId), target: nameOf(targetId) }, myRole: 'requester' }
      intros = [req, ...intros]
      emit()
      // Simulated: intermediary accepts, then target approves. Declines for a deterministic subset.
      later(() => {
        const accept = Number(viaId.split('-')[1]) % 5 !== 0
        intros = intros.map((i) => (i.id === req.id ? { ...i, status: accept ? 'pending_target' : 'declined' } : i))
        notify(accept ? 'intro_forwarded' : 'intro_declined', nameOf(viaId))
      }, 2500)
      later(() => {
        const cur = intros.find((i) => i.id === req.id)
        if (cur?.status !== 'pending_target') return
        intros = intros.map((i) => (i.id === req.id ? { ...i, status: 'completed' } : i))
        notify('intro_accepted', nameOf(targetId))
      }, 5500)
    },
    async respondIntro() { throw new Error('No incoming introduction requests exist in demo mode') },
    async setReveal(otherId, consent) {
      await wait()
      if (!consent) { reveal.set(otherId, 'none'); emit(); return }
      reveal.set(otherId, 'requested_by_me')
      emit()
      later(() => { reveal.set(otherId, 'revealed'); notify('reveal_approved', nameOf(otherId)) }, 2200)
    },
    async notices() { return notices },
    async markNoticesRead() { notices = notices.map((n) => ({ ...n, read: true })); emit() },
    subscribe(cb) { listeners.add(cb); return () => { listeners.delete(cb) } },
  }
}
