import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ExternalLink, UserRound } from 'lucide-react'
import type { Connection } from '../types'
import { Avatar } from './PersonaCard'

const seenKey = (id: string) => `fishnet.reveal.${id}`
const wasSeen = (id: string) => { try { return localStorage.getItem(seenKey(id)) === '1' } catch { return false } }
const markSeen = (id: string) => { try { localStorage.setItem(seenKey(id), '1') } catch { /* ignore */ } }

/** Fictional persona face folds away; consented real identity folds in. Plays once per connection, replayable. */
export function RevealCard({ c, simulated }: { c: Connection; simulated: boolean }) {
  const reduce = useReducedMotion()
  const id = identity(c)
  const [real, setReal] = useState(() => wasSeen(c.id))
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (real) return
    const t = setTimeout(() => { setReal(true); markSeen(c.id) }, reduce ? 0 : 700)
    return () => clearTimeout(t)
  }, [real, c.id, reduce, run])

  const fold = reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0 }
  return (
    <div style={{ perspective: 900 }}>
      <AnimatePresence mode="wait" initial={false}>
        {!real ? (
          <motion.div key="mask" initial={fold} animate={{ rotateY: 0, opacity: 1 }} exit={fold} transition={{ duration: .45, ease: [.22, 1, .36, 1] }} className="flex items-center gap-4 rounded-3xl bg-elevated p-4">
            <Avatar persona={c.persona} size={56} /><div><p className="display text-lg">{c.persona.name}</p><p className="text-xs text-pinky">Lifting the mask…</p></div>
          </motion.div>
        ) : (
          <motion.div key="real" initial={fold} animate={{ rotateY: 0, opacity: 1 }} exit={fold} transition={{ duration: .55, ease: [.22, 1, .36, 1] }} className="rounded-3xl border border-lav/40 bg-elevated p-4 shadow-[var(--glow)]">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-full bg-accent/20 text-lav"><UserRound /></div>
              <div><p className="display text-xl">{id.name}</p><p className="text-sm text-lav">{id.role}</p></div>
            </div>
            {id.bio && <p className="mt-3 text-sm text-mute">{id.bio}</p>}
            {id.linkedin && /^https?:\/\//.test(id.linkedin) && <a className="mt-3 inline-flex items-center gap-1 text-sm text-lav underline" href={id.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ExternalLink size={13} /></a>}
            <p className="mt-3 text-xs text-mute">{simulated ? 'Simulated reveal (demo mode). ' : 'Real identity, shared with mutual consent. '}Persona was {c.persona.name}.</p>
            <button className="mt-2 text-xs text-mute underline" onClick={() => { setReal(false); setRun((r) => r + 1) }}>Replay</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
const identity = (c: Connection) => c.identity ?? { name: 'Unavailable', role: '', bio: '', linkedin: '' }
