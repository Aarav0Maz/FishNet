import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Candidate, Connection, DataSource, GraphData, IntroRequest, MyProfile, MyProfileInput, Notice, Persona, Tags } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const liveConfigured = Boolean(url && key)
export const supabase: SupabaseClient | null = liveConfigured
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  return supabase
}
function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

interface PersonaRow { template: string; name: string; title: string; company: string; bio: string; valuation: string; hue: number }
interface DiscoverRow extends PersonaRow { user_id: string; skills: string[]; interests: string[]; goals: string[]; score: number }
const toCandidate = (r: DiscoverRow): Candidate => ({
  id: r.user_id, score: r.score,
  persona: { template: r.template, name: r.name, title: r.title, company: r.company, bio: r.bio, valuation: r.valuation, hue: r.hue } satisfies Persona,
  tags: { skills: r.skills, interests: r.interests, goals: r.goals } satisfies Tags,
})

export function createLiveSource(userId: string): DataSource {
  return {
    kind: 'live',
    async getMe() {
      const c = db()
      const [p, ps, pi] = await Promise.all([
        c.from('profiles').select('*').eq('id', userId).maybeSingle(),
        c.from('personas').select('*').eq('user_id', userId).maybeSingle(),
        c.from('private_identity').select('*').eq('user_id', userId).maybeSingle(),
      ])
      const prof = check(p), persona = check(ps), real = check(pi)
      if (!prof || !persona || !real) return null
      return {
        id: userId,
        real: { name: real.real_name, role: real.role, bio: real.bio, linkedin: real.linkedin_url },
        tags: { skills: prof.skills, interests: prof.interests, goals: prof.goals },
        settings: { discoverable: prof.discoverable, showInGraph: prof.show_in_graph },
        persona: { template: persona.template, name: persona.name, title: persona.title, company: persona.company, bio: persona.bio, valuation: persona.valuation, hue: persona.hue },
      } satisfies MyProfile
    },
    async saveMe(p: MyProfileInput) {
      const c = db()
      check(await c.from('profiles').upsert({ id: userId, skills: p.tags.skills, interests: p.tags.interests, goals: p.tags.goals, discoverable: p.settings.discoverable, show_in_graph: p.settings.showInGraph }))
      check(await c.from('personas').upsert({ user_id: userId, template: p.persona.template, name: p.persona.name, title: p.persona.title, company: p.persona.company, bio: p.persona.bio, valuation: p.persona.valuation, hue: p.persona.hue }))
      check(await c.from('private_identity').upsert({ user_id: userId, real_name: p.real.name, role: p.real.role, bio: p.real.bio, linkedin_url: p.real.linkedin }))
      return { id: userId, ...p }
    },
    async discover(offset, limit) {
      return check(await db().rpc('discover_page', { p_limit: limit, p_offset: offset })).map(toCandidate)
    },
    async swipe(id, dir) {
      return check(await db().rpc('swipe', { p_target: id, p_dir: dir })) as { matched: boolean }
    },
    async connections() { return check(await db().rpc('get_connections')) as Connection[] },
    async graph() { return check(await db().rpc('get_graph')) as GraphData },
    async recommendations() { return (await this.discover(0, 5)) },
    async intros() { return check(await db().rpc('get_intros')) as IntroRequest[] },
    async requestIntro(viaId, targetId, note) { check(await db().rpc('request_intro', { p_via: viaId, p_target: targetId, p_note: note })) },
    async respondIntro(id, accept) { check(await db().rpc('respond_intro', { p_id: id, p_accept: accept })) },
    async setReveal(otherId, consent) { check(await db().rpc('set_reveal', { p_other: otherId, p_consent: consent })) },
    async notices() {
      const rows = check(await db().from('notifications').select('id,kind,actor_name,read,created_at').order('created_at', { ascending: false }).limit(50))
      return (rows ?? []).map((r): Notice => ({ id: r.id, kind: r.kind, name: r.actor_name, read: r.read, createdAt: r.created_at }))
    },
    async markNoticesRead() { check(await db().from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)) },
    subscribe(cb) {
      const c = db()
      const ch = c.channel(`n-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, cb).subscribe()
      return () => { void c.removeChannel(ch) }
    },
  }
}
