import { ExternalLink, UserRound } from 'lucide-react'
import type { Connection } from '../types'

/** Static real-identity card shown after a mutual reveal. */
export function RevealCard({ c, simulated, onReplay }: { c: Connection; simulated: boolean; onReplay: () => void }) {
  const id = c.identity ?? { name: 'Unavailable', role: '', bio: '', linkedin: '' }
  return (
    <div className="rounded-3xl border border-lav/40 bg-elevated p-4 shadow-[var(--glow)]">
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-accent/20 text-lav"><UserRound /></div>
        <div><p className="display text-xl">{id.name}</p><p className="text-sm text-lav">{id.role}</p></div>
      </div>
      {id.bio && <p className="mt-3 text-sm text-mute">{id.bio}</p>}
      {id.linkedin && /^https?:\/\//.test(id.linkedin) && <a className="mt-3 inline-flex items-center gap-1 text-sm text-lav underline" href={id.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ExternalLink size={13} /></a>}
      <p className="mt-3 text-xs text-mute">{simulated ? 'Simulated reveal (demo mode). ' : 'Shared because you both chose to reveal. '}Persona was {c.persona.name}.</p>
      <button className="mt-2 text-xs text-lav underline" onClick={onReplay}>Replay the reveal</button>
    </div>
  )
}
