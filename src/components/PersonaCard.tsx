import type { Persona, Tags } from '../types'

export const orb = (hue: number) => `radial-gradient(circle at 30% 25%, hsl(${hue} 90% 80%), hsl(${hue} 70% 52%) 55%, hsl(${hue} 60% 28%))`
export const initials = (n: string) => n.replace(/^(Dr\.|Mr\.|Ms\.)\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')

export function Avatar({ persona, size = 56 }: { persona: Persona; size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-full font-display text-white/90 shadow-[var(--glow)]" style={{ width: size, height: size, background: orb(persona.hue), fontSize: size * 0.36 }} aria-hidden>
      {initials(persona.name)}
    </div>
  )
}

export function PersonaCard({ persona, tags, score, compact }: { persona: Persona; tags?: Tags; score?: number; compact?: boolean }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-surface p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]">
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-40 blur-3xl" style={{ background: `hsl(${persona.hue} 80% 55%)` }} />
      <div className="relative flex items-start justify-between">
        <Avatar persona={persona} size={compact ? 52 : 84} />
        <span className="fiction-tag">Fictional persona</span>
      </div>
      <div className="relative mt-5">
        <h2 className="display text-3xl leading-tight">{persona.name}</h2>
        <p className="mt-1 text-lav">{persona.title}</p>
        <p className="text-sm text-mute">{persona.company}{persona.valuation && <> · valued at {persona.valuation}</>}</p>
      </div>
      {!compact && <p className="relative mt-4 text-sm leading-relaxed text-mute">{persona.bio}</p>}
      {tags && !compact && (
        <div className="relative mt-auto flex flex-wrap gap-1.5 pt-5">
          {[...new Set([...tags.interests, ...tags.skills])].slice(0, 6).map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      )}
      {score !== undefined && !compact && <p className="relative mt-3 text-xs text-mute">Relevance {score} · based on shared interests, skills and goals</p>}
    </div>
  )
}
