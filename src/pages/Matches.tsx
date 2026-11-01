import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useWorkspace } from '../workspace'
import type { Connection } from '../types'
import { Avatar } from '../components/PersonaCard'
import { RevealCard } from '../components/RevealCard'
import { RevealCelebration, revealSeen } from '../components/RevealCelebration'
import { Mascot } from '../components/Mascot'

export default function Matches() {
  const { source, version, bump, base } = useWorkspace()
  const nav = useNavigate()
  const [list, setList] = useState<Connection[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [openPersona, setOpenPersona] = useState<string | null>(null)
  const [replay, setReplay] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try { setList(await source.connections()); setErr('') } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load matches') }
  }, [source])
  useEffect(() => { void load() }, [load, version])

  // Someone else may have just completed the reveal: poll while we are waiting on them.
  const waiting = list?.some((c) => c.reveal === 'requested_by_me') ?? false
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(() => { void load() }, 4000)
    return () => clearInterval(t)
  }, [waiting, load])

  // Celebrate the first time a completed reveal is seen (or when replayed on request).
  const celebrating = useMemo(() => list?.find((c) => c.reveal === 'revealed' && ((replay === c.id) || (!revealSeen(c.id) && !dismissed.has(c.id)))) ?? null, [list, replay, dismissed])

  async function reveal(c: Connection, consent: boolean) {
    if (busy) return
    setBusy(c.id); setErr('')
    try { await source.setReveal(c.otherId, consent); await load(); bump() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Action failed') }
    finally { setBusy(null) }
  }

  if (!list && !err) return <div className="grid h-full place-items-center text-mute" role="status">Loading matches…</div>
  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <h1 className="display mb-1 text-3xl">Matches</h1>
      <p className="mb-6 text-sm text-mute">People you matched with. Real identities stay hidden until you both choose to reveal.</p>
      {err && <p role="alert" className="mb-4 text-sm text-pinky">{err} <button className="underline" onClick={() => void load()}>Retry</button></p>}
      {list?.length === 0 && <div className="grid justify-items-center gap-3 py-16 text-center"><Mascot size={120} mood="sleepy" /><p className="display text-2xl">No matches yet</p><button className="btn btn-primary" onClick={() => nav(`${base}/discover`)}>Start swiping</button></div>}
      <ul className="space-y-4">
        {list?.map((c) => (
          <motion.li key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-surface p-5">
            {c.reveal === 'revealed' && c.identity ? (
              <>
                <div className="flex items-center gap-4">
                  <Avatar persona={{ ...c.persona, name: c.identity.name }} size={60} />
                  <div className="min-w-0 flex-1"><p className="display truncate text-xl">{c.identity.name}</p><p className="truncate text-sm text-lav">{c.identity.role}</p></div>
                  <button aria-expanded={openPersona === c.id} aria-label="Show their persona" className="rounded-full p-2 text-mute hover:text-ink" onClick={() => setOpenPersona(openPersona === c.id ? null : c.id)}><ChevronDown className={`transition ${openPersona === c.id ? 'rotate-180' : ''}`} /></button>
                </div>
                {openPersona === c.id && <p className="mt-3 rounded-2xl bg-elevated p-3 text-sm text-mute"><span className="fiction-tag mr-2">Persona</span>{c.persona.name} · {c.persona.title}, {c.persona.company}</p>}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Avatar persona={c.persona} size={60} />
                <div className="min-w-0 flex-1"><p className="display truncate text-xl">{c.persona.name}</p><p className="truncate text-sm text-lav">{c.persona.title}, {c.persona.company}</p><span className="fiction-tag mt-1 inline-block">Fictional persona</span></div>
              </div>
            )}
            <button className="btn btn-ghost mt-4 w-full" onClick={() => nav(`${base}/chat/${c.otherId}`)}><MessageCircle size={16} />Message</button>
            <div className="mt-3">
              {c.reveal === 'revealed' ? <>
                <RevealCard c={c} simulated={source.kind === 'demo'} onReplay={() => setReplay(c.id)} />
                <button className="mt-3 text-xs text-mute underline" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Hide again (withdraws your consent for both of you)</button>
              </> : c.reveal === 'none' ? (
                <div className="space-y-2">
                  <button className="btn btn-primary w-full" disabled={busy === c.id} onClick={() => void reveal(c, true)}>Reveal myself</button>
                  <p className="text-center text-xs text-mute">They get a nudge to reveal too. Nothing is shown until you both press it.</p>
                </div>
              ) : c.reveal === 'requested_by_me' ? (
                <div className="flex items-center justify-between rounded-2xl bg-elevated px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-mute"><span className="size-2 animate-pulse rounded-full bg-accent" />{source.kind === 'demo' ? 'You are ready. Simulating their answer…' : `You are ready. Waiting for ${c.persona.name} to reveal too…`}</span>
                  <button className="text-lav underline" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Cancel</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-pinky">{c.persona.name} is ready to reveal. Your turn?</p>
                  <div className="flex gap-2"><button className="btn btn-primary flex-1" disabled={busy === c.id} onClick={() => void reveal(c, true)}>Reveal back</button><button className="btn btn-ghost flex-1" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Not now</button></div>
                </div>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
      <AnimatePresence>
        {celebrating && <RevealCelebration key={celebrating.id} c={celebrating} simulated={source.kind === 'demo'} onClose={() => { setReplay(null); setDismissed((d) => new Set(d).add(celebrating.id)) }} />}
      </AnimatePresence>
    </div>
  )
}
