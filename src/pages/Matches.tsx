import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useWorkspace } from '../workspace'
import type { Connection } from '../types'
import { Avatar } from '../components/PersonaCard'
import { RevealCard } from '../components/RevealCard'
import { Mascot } from '../components/Mascot'

export default function Matches() {
  const { source, version, bump, base } = useWorkspace()
  const nav = useNavigate()
  const [list, setList] = useState<Connection[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setList(await source.connections()); setErr('') } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load matches') }
  }, [source])
  useEffect(() => { void load() }, [load, version])

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
      <p className="mb-6 text-sm text-mute">People you matched with. Real identities stay hidden until both of you approve.</p>
      {err && <p role="alert" className="mb-4 text-sm text-pinky">{err} <button className="underline" onClick={() => void load()}>Retry</button></p>}
      {list?.length === 0 && <div className="grid justify-items-center gap-3 py-16 text-center"><Mascot size={120} mood="sleepy" /><p className="display text-2xl">No matches yet</p><button className="btn btn-primary" onClick={() => nav(`${base}/discover`)}>Start swiping</button></div>}
      <ul className="space-y-4">
        {list?.map((c) => (
          <motion.li key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-surface p-5">
            <div className="flex items-center gap-4">
              <Avatar persona={c.persona} size={60} />
              <div className="min-w-0 flex-1"><p className="display truncate text-xl">{c.persona.name}</p><p className="truncate text-sm text-lav">{c.persona.title}, {c.persona.company}</p><span className="fiction-tag mt-1 inline-block">Fictional persona</span></div>
            </div>
            <div className="mt-4">
              {c.reveal === 'revealed' ? <>
                <RevealCard c={c} simulated={source.kind === 'demo'} />
                <button className="mt-3 text-xs text-mute underline" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Withdraw consent (hides their real profile again)</button>
              </> : c.reveal === 'none' ? (
                <button className="btn btn-ghost w-full" disabled={busy === c.id} onClick={() => void reveal(c, true)}>Request reality reveal</button>
              ) : c.reveal === 'requested_by_me' ? (
                <div className="flex items-center justify-between rounded-2xl bg-elevated px-4 py-3 text-sm"><span className="text-mute">{source.kind === 'demo' ? 'Waiting (the demo will simulate their answer)…' : 'Waiting for their approval…'}</span><button className="text-lav underline" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Cancel</button></div>
              ) : (
                <div className="space-y-2"><p className="text-sm text-pinky">{c.persona.name} wants to swap real identities.</p>
                  <div className="flex gap-2"><button className="btn btn-primary flex-1" disabled={busy === c.id} onClick={() => void reveal(c, true)}>Approve</button><button className="btn btn-ghost flex-1" disabled={busy === c.id} onClick={() => void reveal(c, false)}>Decline</button></div></div>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
