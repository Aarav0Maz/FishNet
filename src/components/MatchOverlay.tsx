import { motion } from 'motion/react'
import type { Persona } from '../types'
import { Avatar } from './PersonaCard'
import { Mascot } from './Mascot'

export function MatchOverlay({ mine, theirs, simulated, onClose, onView }: { mine: Persona; theirs: Persona; simulated: boolean; onClose: () => void; onView: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-bg/92 p-6 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Mutual match">
      <div className="text-center">
        <div className="relative mx-auto flex h-40 w-72 items-center justify-between">
          {[0, 1, 2].map((i) => <motion.span key={i} className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60" initial={{ scale: .6, opacity: .8 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ delay: .7 + i * .25, duration: 1.4, ease: 'easeOut' }} />)}
          <motion.div initial={{ x: -140, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}><Avatar persona={mine} size={96} /></motion.div>
          <motion.svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="120" height="4" viewBox="0 0 120 4"><motion.line x1="0" y1="2" x2="120" y2="2" stroke="#995CFF" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .45, duration: .5 }} /></motion.svg>
          <motion.div initial={{ x: 140, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}><Avatar persona={theirs} size={96} /></motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9 }}>
          <div className="mx-auto w-fit"><Mascot size={84} mood="happy" /></div>
          <h2 className="display mt-2 text-4xl">It’s a match</h2>
          <p className="mt-2 text-mute">{mine.name} and {theirs.name} are now connected.</p>
          {simulated && <p className="mx-auto mt-3 w-fit rounded-full bg-pinky/15 px-3 py-1 text-xs text-pinky">Simulated match · demo mode</p>}
          <div className="mt-6 flex justify-center gap-3"><button className="btn btn-ghost" onClick={onClose}>Keep swiping</button><button className="btn btn-primary" onClick={onView}>View network</button></div>
        </motion.div>
      </div>
    </motion.div>
  )
}
