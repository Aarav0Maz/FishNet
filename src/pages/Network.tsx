import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Route as RouteIcon, X } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { shortestPath } from '../lib/graph'
import type { Candidate, GraphData } from '../types'
import { Avatar } from '../components/PersonaCard'

const GraphCanvas = lazy(() => import('../components/GraphCanvas'))

export default function Network() {
  const { source, me, version, base } = useWorkspace()
  const nav = useNavigate()
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [recs, setRecs] = useState<Candidate[]>([])
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    try { const [g, r] = await Promise.all([source.graph(), source.recommendations()]); setGraph(g); setRecs(r); setErr('') }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not load network') }
  }, [source])
  useEffect(() => { void load() }, [load, version])

  const byId = useMemo(() => new Map(graph?.nodes.map((n) => [n.id, n]) ?? []), [graph])
  const path = useMemo(() => (graph && me && target ? shortestPath(graph.edges, me.id, target) : null), [graph, me, target])
  const sel = selected ? (selected.startsWith('rec:') ? null : byId.get(selected) ?? null) : null
  const selRec = selected?.startsWith('rec:') ? recs.find((r) => `rec:${r.id}` === selected) : undefined
  const names = (ids: string[]) => ids.map((i) => byId.get(i)?.persona.name ?? '?')

  async function ask() {
    if (!path || path.length < 3 || busy) return
    setBusy(true); setMsg(null)
    try { await source.requestIntro(path[1], path[2], note); setMsg({ ok: true, text: `Request sent to ${names([path[1]])[0]}. Track it in Intros.` }); setNote('') }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Request failed' }) }
    finally { setBusy(false) }
  }

  if (err) return <div className="grid h-full place-content-center gap-3 p-6 text-center"><p className="text-pinky">{err}</p><button className="btn btn-ghost mx-auto" onClick={() => void load()}>Retry</button></div>
  if (!graph || !me) return <div className="grid h-full place-items-center text-mute" role="status">Mapping your network…</div>
  const lonely = graph.nodes.length <= 1

  return (
    <div className="relative h-[calc(100vh-5.5rem)] md:h-full">
      <div className="absolute left-4 right-4 top-2 z-10 flex flex-wrap items-center gap-2 md:left-6">
        <h1 className="display mr-2 text-2xl">Network</h1>
        <label className="sr-only" htmlFor="tgt">Find a route to</label>
        <select id="tgt" className="field !w-auto max-w-[60%] !py-2 text-sm" value={target ?? ''} onChange={(e) => { setTarget(e.target.value || null); setSelected(e.target.value || null); setMsg(null) }}>
          <option value="">Find a route to…</option>
          {graph.nodes.filter((n) => n.degree > 0).map((n) => <option key={n.id} value={n.id}>{n.persona.name}{n.degree > 1 ? ` · ${n.degree} hops` : ''}</option>)}
        </select>
        {target && <button className="btn btn-ghost !min-h-9 !py-1 text-sm" onClick={() => { setTarget(null); setMsg(null) }}>Clear</button>}
      </div>
      {lonely && <div className="absolute inset-0 z-10 grid place-content-center gap-3 text-center"><p className="display text-2xl">No connections yet</p><p className="text-sm text-mute">Match with someone in Discover and they will appear here.</p><button className="btn btn-primary mx-auto" onClick={() => nav(`${base}/discover`)}>Go discover</button></div>}
      <Suspense fallback={<div className="grid h-full place-items-center text-mute">Loading map…</div>}>
        <GraphCanvas graph={graph} recs={recs} meId={me.id} path={path} selected={selected} onSelect={setSelected} />
      </Suspense>
      <p className="pointer-events-none absolute bottom-3 left-4 hidden text-xs text-mute md:block">Solid lines: confirmed connections · Dashed: suggestions (not connected)</p>

      {target && (
        <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-lg rounded-3xl border border-white/10 bg-surface/95 p-4 backdrop-blur" role="region" aria-label="Route">
          {path ? <>
            <p className="flex items-center gap-2 text-sm"><RouteIcon size={16} className="text-lav" />{path.length - 1} hop{path.length > 2 ? 's' : ''} through confirmed connections</p>
            <p className="mt-1 text-sm text-mute">{names(path).map((n, i) => <span key={i}>{i > 0 && ' → '}<span className={i === 0 ? 'text-ink' : 'text-lav'}>{n}</span></span>)}</p>
            {path.length >= 3 ? <div className="mt-3 space-y-2">
              <input className="field !py-2 text-sm" placeholder={`Note to ${names([path[1]])[0]} (optional)`} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary w-full" disabled={busy} onClick={ask}>{busy ? 'Sending…' : `Ask ${names([path[1]])[0]} to introduce you to ${names([path[2]])[0]}`}</button>
            </div> : <p className="mt-2 text-sm text-mute">You are already connected.</p>}
          </> : <p className="text-sm text-mute">No route found through confirmed connections.</p>}
          {msg && <p role="status" className={`mt-2 text-sm ${msg.ok ? 'text-lav' : 'text-pinky'}`}>{msg.text}</p>}
        </div>
      )}

      <AnimatePresence>
        {(sel || selRec) && (
          <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} className="absolute right-3 top-14 z-20 w-72 max-w-[calc(100%-1.5rem)] rounded-3xl border border-white/10 bg-surface/95 p-5 backdrop-blur">
            <button aria-label="Close details" className="absolute right-3 top-3 text-mute hover:text-ink" onClick={() => setSelected(null)}><X size={18} /></button>
            {(() => { const p = sel?.persona ?? selRec!.persona; return <>
              <Avatar persona={p} size={56} />
              <h2 className="display mt-3 text-xl">{sel?.revealedName ?? p.name}</h2>
              {sel?.revealedName && <p className="text-xs text-lav">Revealed · persona: {p.name}</p>}
              <p className="text-sm text-lav">{p.title}</p><p className="text-xs text-mute">{p.company} · {p.valuation}</p>
              <span className="fiction-tag mt-2 inline-block">Fictional persona</span>
              <p className="mt-3 text-sm text-mute">{p.bio}</p>
              {sel && sel.degree > 0 && <button className="btn btn-primary mt-4 w-full" onClick={() => { setTarget(sel.id); setMsg(null) }}>{sel.degree === 1 ? 'Show route' : 'Find route'}</button>}
              {selRec && <p className="mt-3 text-xs text-mute">Suggested for you. Swipe on them in Discover to connect.</p>}
              {sel?.id === me.id && <p className="mt-3 text-xs text-mute">This is you.</p>}
            </> })()}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
