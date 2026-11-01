import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useWorkspace } from '../workspace'
import type { ChatMessage, Connection } from '../types'
import { Avatar } from '../components/PersonaCard'
import { conversationStarters } from '../lib/starters'
import { sfx } from '../lib/sound'

export default function Chat() {
  const { otherId = '' } = useParams()
  const { source, me, base, version } = useWorkspace()
  const nav = useNavigate()
  const [conn, setConn] = useState<Connection | null | undefined>(undefined)
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const end = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try { setMsgs(await source.messages(otherId)); setErr('') } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load messages') }
  }, [source, otherId])

  useEffect(() => { source.connections().then((cs) => setConn(cs.find((c) => c.otherId === otherId) ?? null)).catch(() => setConn(null)) }, [source, otherId, version])
  useEffect(() => { void load() }, [load, version])
  useEffect(() => { const t = setInterval(() => { void load() }, 5000); return () => clearInterval(t) }, [load]) // fallback if Realtime is unavailable
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true); setErr('')
    try { await source.sendMessage(otherId, body); sfx.send(); setText(''); await load() }
    catch (x) { sfx.error(); setErr(x instanceof Error ? x.message : 'Could not send') }
    finally { setSending(false) }
  }

  if (conn === undefined) return <div className="grid h-full place-items-center text-mute" role="status">Loading…</div>
  if (conn === null || !me) return <div className="grid h-full place-content-center gap-3 p-6 text-center"><p>You can only chat with people you matched with.</p><button className="btn btn-ghost mx-auto" onClick={() => nav(`${base}/matches`)}>Back to matches</button></div>

  const revealed = conn.reveal === 'revealed' && conn.identity
  const name = revealed ? conn.identity!.name : conn.persona.name
  const starters = conversationStarters(me.tags, conn.tags, conn.persona)

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-2xl flex-col px-4 md:h-full md:py-4">
      <header className="flex items-center gap-3 pb-3 pr-12 md:pr-0">
        <button aria-label="Back to matches" className="rounded-full p-2 text-mute hover:text-ink" onClick={() => nav(`${base}/matches`)}><ArrowLeft /></button>
        <Avatar persona={{ ...conn.persona, name }} size={44} />
        <div className="min-w-0"><p className="display truncate text-lg">{name}</p><p className="truncate text-xs text-mute">{revealed ? conn.identity!.role : 'Masked · talking to their fictional persona'}</p></div>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-3xl bg-surface p-4" aria-live="polite">
        {msgs.length === 0 && (
          <div className="space-y-2 py-4">
            <p className="text-center text-sm text-mute">Break the ice. Tap a starter to use it.</p>
            {starters.map((s) => <button key={s} className="block w-full rounded-2xl bg-elevated p-3 text-left text-sm text-lav hover:text-ink" onClick={() => setText(s.startsWith('Open in character: ') ? s.slice(19).replace(/^"|"$/g, '') : s)}>{s}</button>)}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${m.mine ? 'bg-accent text-white' : 'bg-elevated'}`}>{m.body}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      {source.kind === 'demo' && <p className="pt-2 text-center text-xs text-pinky">Demo: replies are simulated.</p>}
      {err && <p role="alert" className="pt-2 text-sm text-pinky">{err}</p>}
      <form onSubmit={send} className="flex gap-2 py-3">
        <label className="sr-only" htmlFor="msg">Message</label>
        <input id="msg" className="field" value={text} maxLength={1000} placeholder="Say something in character…" onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <button className="btn btn-primary !px-4" disabled={sending || !text.trim()} aria-label="Send"><Send size={18} /></button>
      </form>
    </div>
  )
}
