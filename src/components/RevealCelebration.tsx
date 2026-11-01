import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ExternalLink, UserRound } from 'lucide-react'
import type { Connection } from '../types'
import { Avatar } from './PersonaCard'
import { Mascot } from './Mascot'
import { drumRoll, dings } from '../lib/sound'

const seenKey = (id: string) => `fishnet.reveal.${id}`
export const revealSeen = (id: string) => { try { return localStorage.getItem(seenKey(id)) === '1' } catch { return false } }
const markSeen = (id: string) => { try { localStorage.setItem(seenKey(id), '1') } catch { /* ignore */ } }

const ROLL_MS = 2600
const BURST = Array.from({ length: 28 }, (_, i) => ({ a: (i / 28) * Math.PI * 2, d: 140 + (i % 4) * 55, s: 6 + (i % 3) * 4, h: [270, 300, 330, 260][i % 4] }))

/** Drum roll, burst, then the persona card flips into the other person's real, consented identity. */
export function RevealCelebration({ c, simulated, onClose }: { c: Connection; simulated: boolean; onClose: () => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'roll' | 'burst' | 'card'>('roll')
  const id = c.identity ?? { name: 'Unavailable', role: '', bio: '', linkedin: '' }
  const dots = useMemo(() => [0, 1, 2], [])

  // Wait until the tab is actually visible so a reveal finished in the background is not missed.
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const start = () => {
      drumRoll(ROLL_MS / 1000)
      timers = [
        setTimeout(() => { setPhase('burst'); dings(3) }, ROLL_MS),
        setTimeout(() => { setPhase('card'); markSeen(c.id) }, ROLL_MS + 900),
      ]
    }
    const onVisible = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', onVisible); start() } }
    if (document.visibilityState === 'visible') start()
    else document.addEventListener('visibilitychange', onVisible)
    return () => { timers.forEach(clearTimeout); document.removeEventListener('visibilitychange', onVisible) }
  }, [c.id])

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-bg/95 p-5 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Reality reveal">
      <motion.div className="pointer-events-none absolute size-[34rem] rounded-full bg-accent/25 blur-3xl" animate={{ scale: phase === 'roll' ? [0.8, 1.05, 0.8] : 1.3, opacity: phase === 'card' ? 0.5 : 0.9 }} transition={{ duration: phase === 'roll' ? 0.5 : 0.8, repeat: phase === 'roll' ? Infinity : 0 }} />

      {phase !== 'card' && (
        <div className="relative text-center">
          <motion.div className="mx-auto w-fit" animate={phase === 'roll' && !reduce ? { x: [-5, 5, -4, 4, -3, 3, 0], rotate: [-3, 3, -2, 2, 0] } : { scale: [1, 1.5, 0], opacity: [1, 1, 0] }} transition={phase === 'roll' ? { duration: 0.28, repeat: Infinity } : { duration: 0.7 }}>
            <Avatar persona={c.persona} size={132} />
          </motion.div>
          <p className="display mt-6 text-3xl">{phase === 'roll' ? 'Drum roll please' : ''}{phase === 'roll' && dots.map((d) => <motion.span key={d} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.2 }}>.</motion.span>)}</p>
          <p className="mt-2 text-sm text-mute">{c.persona.name} is about to lose the mask</p>
          {phase === 'burst' && !reduce && BURST.map((p, i) => (
            <motion.span key={i} className="absolute left-1/2 top-[66px] rounded-full" style={{ width: p.s, height: p.s, background: `hsl(${p.h} 90% 70%)` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d, opacity: 0, scale: 0.4 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          ))}
          {phase === 'burst' && <motion.p className="display mt-4 text-4xl text-pinky" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>Ding ding ding!</motion.p>}
        </div>
      )}

      {phase === 'card' && (
        <motion.div className="relative w-full max-w-sm" style={{ perspective: 1000 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div initial={reduce ? { opacity: 0 } : { rotateY: 180, scale: 0.8, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}
            className="rounded-[2rem] border border-lav/40 bg-surface p-7 text-center shadow-[0_0_80px_-10px_rgba(153,92,255,.7)]">
            <div className="mx-auto w-fit"><Mascot size={72} mood="happy" /></div>
            <p className="mt-2 text-xs uppercase tracking-widest text-pinky">Mask off · {c.persona.name}</p>
            <div className="mx-auto mt-4 grid size-20 place-items-center rounded-full bg-accent/20 text-lav"><UserRound size={36} /></div>
            <h2 className="display mt-3 text-4xl">{id.name}</h2>
            {id.role && <p className="text-lav">{id.role}</p>}
            {id.bio && <p className="mt-3 text-sm text-mute">{id.bio}</p>}
            {id.linkedin && /^https?:\/\//.test(id.linkedin) && <a className="mt-3 inline-flex items-center gap-1 text-sm text-lav underline" href={id.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ExternalLink size={13} /></a>}
            <p className="display mt-5 text-base text-ink">The persona was fictional. The connection is real.</p>
            {simulated && <p className="mt-2 text-xs text-pinky">Simulated reveal · demo mode</p>}
            <button className="btn btn-primary mt-5 w-full" onClick={onClose}>Nice to meet you</button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
