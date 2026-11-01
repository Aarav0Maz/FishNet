import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ChevronLeft, MessageCircle, X } from 'lucide-react'
import type { GraphNode, IntroRequest } from '../types'
import { Avatar } from './PersonaCard'
import { sfx } from '../lib/sound'

interface Props {
  route: string[]            // snapshot of the route when the walk began: me, stop 1, ..., target
  step: number               // index into route of the person on screen (>= 1)
  nodes: Map<string, GraphNode>
  intros: IntroRequest[]
  busy: boolean
  onStep: (i: number) => void
  onAsk: (viaId: string, targetId: string, note: string) => void
  onMessage: (id: string) => void
  onClose: () => void
}

/** Guided walk down a route: shows each person in turn, lets you message them once connected, and asks the previous stop to introduce the next. */
export function PathWalk({ route, step, nodes, intros, busy, onStep, onAsk, onMessage, onClose }: Props) {
  const [note, setNote] = useState('')
  const cur = nodes.get(route[step])
  const prev = nodes.get(route[step - 1])
  if (!cur) return null
  const label = (n?: GraphNode) => n?.revealedName ?? n?.persona.name ?? 'them'
  const connected = cur.degree === 1
  const last = step === route.length - 1
  const intro = intros.filter((i) => i.targetId === cur.id && i.viaId === route[step - 1]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const open = intro && (intro.status === 'pending_via' || intro.status === 'pending_target')
  const go = (i: number) => { sfx.tick(); onStep(i) }

  return (
    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-lg rounded-3xl border border-lav/30 bg-surface/95 p-4 shadow-[0_0_60px_-15px_rgba(153,92,255,.8)] backdrop-blur" role="region" aria-label="Path walk">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-label={`Stop ${step} of ${route.length - 1}`}>
          {route.slice(1).map((id, i) => <span key={id} className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-6 bg-accent' : i + 1 < step ? 'w-3 bg-lav/70' : 'w-3 bg-elevated'}`} />)}
          <span className="ml-2 text-xs text-mute">Stop {step} of {route.length - 1}</span>
        </div>
        <button aria-label="End path" className="rounded-full p-1.5 text-mute hover:text-ink" onClick={onClose}><X size={18} /></button>
      </div>

      <motion.div key={cur.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-4">
        <Avatar persona={{ ...cur.persona, name: label(cur) }} size={64} />
        <div className="min-w-0">
          <p className="display truncate text-xl">{label(cur)}</p>
          <p className="truncate text-sm text-lav">{cur.persona.title}, {cur.persona.company}</p>
          {cur.revealedName ? <p className="text-xs text-mute">Persona: {cur.persona.name}</p> : <span className="fiction-tag mt-1 inline-block">Fictional persona</span>}
        </div>
      </motion.div>

      <div className="mt-4 space-y-2">
        {connected ? (
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={() => onMessage(cur.id)}><MessageCircle size={17} />Message {label(cur).split(' ')[0]}</button>
            {!last && <button className="btn btn-ghost" onClick={() => go(step + 1)}>Next stop<ArrowRight size={16} /></button>}
          </div>
        ) : intro?.status === 'completed' ? (
          <div className="rounded-2xl bg-elevated px-4 py-3 text-sm text-lav">Introduction approved. Connecting you…</div>
        ) : open ? (
          <div className="flex items-center gap-3 rounded-2xl bg-elevated px-4 py-3 text-sm text-mute">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent" />
            {intro.status === 'pending_via' ? `Waiting for ${label(prev)} to agree to introduce you…` : `${label(prev)} agreed. Waiting for ${label(cur)} to accept…`}
          </div>
        ) : (
          <>
            {intro && <p className="text-sm text-pinky">{intro.status === 'declined' ? 'That introduction was declined.' : 'That introduction expired.'} You can ask again.</p>}
            <input className="field !py-2 text-sm" placeholder={`Note to ${label(prev)} (optional)`} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={busy} onClick={() => onAsk(route[step - 1], cur.id, note)}>{busy ? 'Sending…' : `Ask ${label(prev)} to introduce you to ${label(cur)}`}</button>
          </>
        )}
        {last && connected && <p className="text-center text-xs text-lav">You made it. Everyone on this path is now a connection.</p>}
        {step > 1 && <button className="flex items-center gap-1 text-xs text-mute hover:text-ink" onClick={() => go(step - 1)}><ChevronLeft size={14} />Previous stop</button>}
      </div>
    </motion.div>
  )
}
