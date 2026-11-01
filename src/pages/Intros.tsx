import { useCallback, useEffect, useState } from 'react'
import { useWorkspace } from '../workspace'
import type { IntroRequest, IntroStatus } from '../types'

const label: Record<IntroStatus, string> = { pending_via: 'Waiting for the intermediary', pending_target: 'Waiting for the target to approve', completed: 'Introduction completed', declined: 'Declined' }

export default function Intros() {
  const { source, version, bump } = useWorkspace()
  const [list, setList] = useState<IntroRequest[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const load = useCallback(async () => { try { setList(await source.intros()); setErr('') } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load') } }, [source])
  useEffect(() => { void load() }, [load, version])

  async function respond(id: string, accept: boolean) {
    if (busy) return
    setBusy(id)
    try { await source.respondIntro(id, accept); await load(); bump() } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') } finally { setBusy(null) }
  }
  if (!list && !err) return <div className="grid h-full place-items-center text-mute" role="status">Loading…</div>
  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <h1 className="display mb-1 text-3xl">Introductions</h1>
      <p className="mb-6 text-sm text-mute">An intro completes only after the intermediary and the target both agree. Contact details are never shared by introductions.</p>
      {source.kind === 'demo' && <p className="mb-4 rounded-2xl bg-pinky/10 p-3 text-xs text-pinky">Demo: the other people’s responses are simulated a few seconds after you ask.</p>}
      {err && <p role="alert" className="mb-4 text-sm text-pinky">{err}</p>}
      {list?.length === 0 && <p className="py-12 text-center text-mute">No introductions yet. Find a route in the Network tab, then ask for one.</p>}
      <ul className="space-y-3">
        {list?.map((r) => {
          const actionable = (r.myRole === 'via' && r.status === 'pending_via') || (r.myRole === 'target' && r.status === 'pending_target')
          return (
            <li key={r.id} className="rounded-3xl bg-surface p-5">
              <p><span className="text-lav">{r.names.requester}</span> → <span className="text-lav">{r.names.via}</span> → <span className="text-lav">{r.names.target}</span></p>
              {r.note && <p className="mt-1 text-sm italic text-mute">“{r.note}”</p>}
              <p className={`mt-2 text-sm ${r.status === 'completed' ? 'text-lav' : r.status === 'declined' ? 'text-pinky' : 'text-mute'}`}>{label[r.status]} · you are the {r.myRole}</p>
              {actionable && <div className="mt-3 flex gap-2"><button className="btn btn-primary flex-1" disabled={busy === r.id} onClick={() => void respond(r.id, true)}>Accept</button><button className="btn btn-ghost flex-1" disabled={busy === r.id} onClick={() => void respond(r.id, false)}>Decline</button></div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
