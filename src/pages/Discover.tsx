import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Heart, X } from 'lucide-react'
import { useWorkspace } from '../workspace'
import type { Candidate } from '../types'
import { PersonaCard } from '../components/PersonaCard'
import { MatchOverlay } from '../components/MatchOverlay'
import { Mascot } from '../components/Mascot'
import { InviteButton } from '../components/InviteButton'
import { sfx } from '../lib/sound'

const PAGE = 10
const THRESHOLD = 110

export default function Discover() {
  const { source, me, base, bump } = useWorkspace()
  const nav = useNavigate()
  const [deck, setDeck] = useState<Candidate[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [match, setMatch] = useState<Candidate | null>(null)
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const loading = useRef(false)
  const seen = useRef(new Set<string>())
  const [exitDir, setExitDir] = useState<'like' | 'pass'>('like')

  const load = useCallback(async (reset = false) => {
    if (loading.current) return
    loading.current = true
    try {
      if (reset) { seen.current.clear(); setState('loading') }
      // Offset is always 0: swiped profiles drop out of the server query, so the next page is the new first page.
      const page = (await source.discover(0, PAGE)).filter((c) => !seen.current.has(c.id))
      page.forEach((c) => seen.current.add(c.id))
      setDeck((d) => (reset ? page : [...d, ...page]))
      if (page.length < 1) setDone(true)
      setState('ready')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to load'); setState('error') }
    finally { loading.current = false }
  }, [source])

  useEffect(() => { void load(true) }, [load])
  useEffect(() => { if (state === 'ready' && deck.length > 0 && deck.length <= 3 && !done) void load() }, [deck.length, state, done, load])

  // Newly joined people only appear on fetch; re-check when the user returns to an empty deck.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible' && deck.length === 0 && state === 'ready') { setDone(false); void load(true) } }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [deck.length, state, load])

  const act = useCallback(async (dir: 'like' | 'pass') => {
    const top = deck[0]
    if (!top || pending.current) return false
    pending.current = true
    try {
      const r = await source.swipe(top.id, dir)
      setExitDir(dir)
      setDeck((d) => d.slice(1))
      if (r.matched) { sfx.match(); setMatch(top); bump() } else if (dir === 'like') sfx.like(); else sfx.pass()
      return true
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Swipe failed. Try again.')
      return false
    } finally { pending.current = false }
  }, [deck, source, bump])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (match || (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName))) return
      if (e.key === 'ArrowRight') { void act('like') } else if (e.key === 'ArrowLeft') { void act('pass') }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [act, match])

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-6">
      <h1 className="display mb-4 text-3xl">Encounters</h1>
      <div className="relative h-[28rem] w-full">
        {state === 'loading' && <div className="grid h-full place-items-center text-mute" role="status">Finding people…</div>}
        {state === 'error' && <div className="grid h-full place-content-center gap-3 text-center"><p className="text-pinky">{err}</p><button className="btn btn-ghost mx-auto" onClick={() => void load(true)}>Retry</button></div>}
        {state === 'ready' && deck.length === 0 && (
          <div className="grid h-full place-content-center justify-items-center gap-3 text-center"><Mascot size={120} mood="sleepy" /><p className="display text-2xl">The pond is quiet</p><p className="max-w-xs text-sm text-mute">You have seen everyone for now. Check back as more people join, or explore your network.</p>
            <div className="flex gap-2"><button className="btn btn-ghost" onClick={() => { setDone(false); void load(true) }}>Refresh</button><button className="btn btn-primary" onClick={() => nav(`${base}/network`)}>Open network</button></div><InviteButton className="btn btn-ghost" label="Invite friends to play" /></div>
        )}
        <AnimatePresence custom={exitDir}>
          {deck.slice(0, 2).reverse().map((c, i, arr) => <SwipeCard key={c.id} c={c} isTop={i === arr.length - 1} onSwipe={act} dir={exitDir} />)}
        </AnimatePresence>
      </div>
      {notice && <p role="alert" className="mt-3 text-center text-sm text-pinky">{notice}</p>}
      <div className="mt-6 flex justify-center gap-6">
        <button aria-label="Pass" className="btn btn-ghost size-16 !p-0" disabled={!deck.length} onClick={() => void act('pass')}><X /></button>
        <button aria-label="Like" className="btn btn-primary size-16 !p-0" disabled={!deck.length} onClick={() => void act('like')}><Heart /></button>
      </div>
      <p className="mt-3 text-center text-xs text-mute">Drag the card, or use ← → keys. A connection forms only when you both like each other.</p>
      <AnimatePresence>
        {match && me && <MatchOverlay mine={me.persona} theirs={match.persona} simulated={source.kind === 'demo'} onClose={() => setMatch(null)} onView={() => nav(`${base}/network`)} />}
      </AnimatePresence>
    </div>
  )
}

function SwipeCard({ c, isTop, onSwipe, dir }: { c: Candidate; isTop: boolean; onSwipe: (d: 'like' | 'pass') => Promise<boolean>; dir: 'like' | 'pass' }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], reduce ? [0, 0] : [-14, 14])
  const likeOp = useTransform(x, [20, THRESHOLD], [0, 1])
  const passOp = useTransform(x, [-THRESHOLD, -20], [1, 0])
  const settle = () => animate(x, 0, { type: 'spring', stiffness: 380, damping: 28 })

  async function release(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const dir = info.offset.x > THRESHOLD || info.velocity.x > 600 ? 'like' : info.offset.x < -THRESHOLD || info.velocity.x < -600 ? 'pass' : null
    if (!dir) return void settle()
    const ok = await onSwipe(dir)
    if (!ok) settle()
  }
  return (
    <motion.div
      className="absolute inset-0 touch-pan-y select-none"
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      drag={isTop ? 'x' : false} dragElastic={0.9} dragMomentum={false} onDragEnd={release}
      initial={{ scale: isTop ? 1 : 0.94, opacity: 0, y: isTop ? 20 : 0 }}
      animate={{ scale: isTop ? 1 : 0.94, opacity: isTop ? 1 : 0.6, y: isTop ? 0 : 14 }}
      custom={dir}
      variants={{ exit: (d: 'like' | 'pass') => ({ x: d === 'like' ? 520 : -520, opacity: 0, rotate: d === 'like' ? 20 : -20, transition: { duration: .28 } }) }}
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <PersonaCard persona={c.persona} tags={c.tags} score={c.score} />
      <motion.span style={{ opacity: likeOp }} className="pointer-events-none absolute left-6 top-24 rotate-[-12deg] rounded-xl border-2 border-lav px-3 py-1 text-xl font-semibold text-lav">INTERESTED</motion.span>
      <motion.span style={{ opacity: passOp }} className="pointer-events-none absolute right-6 top-24 rotate-[12deg] rounded-xl border-2 border-mute px-3 py-1 text-xl font-semibold text-mute">PASS</motion.span>
    </motion.div>
  )
}
