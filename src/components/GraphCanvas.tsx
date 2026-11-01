import { useEffect, useMemo, useState } from 'react'
import { Background, Controls, Handle, Position, ReactFlow, getStraightPath, useReactFlow, type EdgeProps, type Node, type NodeProps, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Candidate, GraphData, GraphNode } from '../types'
import { orb, initials } from './PersonaCard'

export interface CanvasProps {
  graph: GraphData
  recs: Candidate[]
  meId: string
  path: string[] | null
  selected: string | null
  onSelect: (id: string | null) => void
}
type NData = { label: string; hue: number; degree: number; me: boolean; rec: boolean; dim: boolean; onPath: boolean; selected: boolean; revealed: boolean }
type EData = { dim: boolean; onPath: boolean; rec: boolean }

function FNode({ data }: NodeProps<Node<NData>>) {
  const size = data.me ? 72 : data.degree === 1 ? 56 : 44
  return (
    <div className="flex flex-col items-center gap-1 transition-opacity duration-500" style={{ opacity: data.dim ? 0.18 : 1 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, top: size / 2, left: '50%' }} isConnectable={false} />
      <Handle type="source" position={Position.Top} style={{ opacity: 0, top: size / 2, left: '50%' }} isConnectable={false} />
      <div className="grid place-items-center rounded-full font-display text-white/90" style={{
        width: size, height: size, background: orb(data.hue), fontSize: size * 0.34,
        border: data.rec ? '2px dashed rgba(201,167,255,.7)' : '2px solid rgba(255,255,255,.12)',
        boxShadow: data.onPath || data.selected || data.me ? '0 0 0 3px rgba(153,92,255,.9), 0 0 28px rgba(153,92,255,.7)' : 'none',
        opacity: data.rec ? 0.7 : 1,
      }}>{initials(data.label)}</div>
      <span className="max-w-28 truncate text-center text-xs font-medium text-ink/90">{data.revealed ? `✦ ${data.label}` : data.label}</span>
    </div>
  )
}

function FEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<Edge<EData>>) {
  const [d] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const s = data!
  return <path id={id} d={d} pathLength={1} fill="none" className={`fn-edge ${s.rec ? 'rec' : ''}`}
    style={{ stroke: s.onPath ? '#C9A7FF' : s.rec ? '#8a7aa8' : '#995CFF', strokeWidth: s.onPath ? 3.5 : 1.6, opacity: s.dim ? 0.08 : s.rec ? 0.55 : s.onPath ? 1 : 0.6, transition: 'opacity .5s, stroke-width .3s' }} />
}
const nodeTypes = { fn: FNode }
const edgeTypes = { fn: FEdge }

function layout(nodes: GraphNode[], edges: [string, string][], recs: Candidate[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()
  const ang = new Map<string, number>()
  const R = [0, 200, 360, 510]
  const me = nodes.find((n) => n.degree === 0)
  if (me) pos.set(me.id, { x: 0, y: 0 })
  for (let d = 1; d <= 3; d++) {
    const ring = nodes.filter((n) => n.degree === d)
    const withPref = ring.map((n, i) => {
      const parents = edges.map(([a, b]) => (a === n.id ? b : b === n.id ? a : null)).filter((x): x is string => !!x && ang.has(x))
      const pref = d === 1 ? (i / ring.length) * Math.PI * 2 : parents.length ? parents.reduce((s, p) => s + ang.get(p)!, 0) / parents.length : (i / ring.length) * Math.PI * 2
      return { n, pref }
    }).sort((a, b) => a.pref - b.pref)
    const minGap = (2 * Math.PI) / Math.max(withPref.length, 1)
    let last = -Infinity
    withPref.forEach(({ n, pref }, i) => {
      const a = d === 1 ? (i / withPref.length) * Math.PI * 2 - Math.PI / 2 : Math.max(pref, last + Math.min(minGap, 0.28))
      last = a
      ang.set(n.id, a)
      pos.set(n.id, { x: Math.cos(a) * R[d], y: Math.sin(a) * R[d] })
    })
  }
  recs.forEach((r, i) => { const a = (i / Math.max(recs.length, 1)) * Math.PI * 2 + 0.3; pos.set(`rec:${r.id}`, { x: Math.cos(a) * 640, y: Math.sin(a) * 640 }) })
  return pos
}

/** Glides the camera to the active route, and back out when it is cleared. */
function FitRoute({ path, count }: { path: string[] | null; count: number }) {
  const rf = useReactFlow()
  useEffect(() => {
    if (count === 0) return
    // wait a frame so nodes have left the origin before measuring
    const t = setTimeout(() => {
      if (path && path.length > 1) void rf.fitView({ nodes: path.map((id) => ({ id })), duration: 700, padding: 0.5 })
      else void rf.fitView({ duration: 800, padding: 0.12 })
    }, 350)
    return () => clearTimeout(t)
  }, [path, rf, count])
  return null
}

export default function GraphCanvas({ graph, recs, meId, path, selected, onSelect }: CanvasProps) {
  const targets = useMemo(() => layout(graph.nodes, graph.edges, recs), [graph, recs])
  const [placed, setPlaced] = useState<Set<string>>(new Set())

  // New nodes start at the centre and glide out on the next frame (CSS transform transition).
  useEffect(() => {
    const id = requestAnimationFrame(() => setPlaced(new Set(targets.keys())))
    return () => cancelAnimationFrame(id)
  }, [targets])

  const onPathIds = useMemo(() => new Set(path ?? []), [path])
  const pathEdges = useMemo(() => {
    const s = new Set<string>()
    if (path) for (let i = 0; i < path.length - 1; i++) s.add([path[i], path[i + 1]].sort().join('|'))
    return s
  }, [path])
  const hasPath = !!path

  const nodes: Node<NData>[] = useMemo(() => [
    ...graph.nodes.map((n): Node<NData> => ({
      id: n.id, type: 'fn', draggable: false, selectable: true,
      position: placed.has(n.id) ? targets.get(n.id)! : { x: 0, y: 0 },
      data: { label: n.revealedName ?? n.persona.name, hue: n.persona.hue, degree: n.degree, me: n.id === meId, rec: false, dim: hasPath && !onPathIds.has(n.id), onPath: onPathIds.has(n.id) && hasPath, selected: selected === n.id, revealed: !!n.revealedName },
    })),
    ...recs.map((r): Node<NData> => ({
      id: `rec:${r.id}`, type: 'fn', draggable: false,
      position: placed.has(`rec:${r.id}`) ? targets.get(`rec:${r.id}`)! : { x: 0, y: 0 },
      data: { label: r.persona.name, hue: r.persona.hue, degree: 9, me: false, rec: true, dim: hasPath, onPath: false, selected: selected === `rec:${r.id}`, revealed: false },
    })),
  ], [graph.nodes, recs, targets, placed, hasPath, onPathIds, selected, meId])

  const edges: Edge<EData>[] = useMemo(() => [
    ...graph.edges.map(([a, b]): Edge<EData> => {
      const on = pathEdges.has([a, b].sort().join('|'))
      return { id: `${a}-${b}`, source: a, target: b, type: 'fn', data: { dim: hasPath && !on, onPath: on, rec: false } }
    }),
    ...recs.map((r): Edge<EData> => ({ id: `rec-${r.id}`, source: meId, target: `rec:${r.id}`, type: 'fn', data: { dim: hasPath, onPath: false, rec: true } })),
  ], [graph.edges, recs, pathEdges, hasPath, meId])

  return (
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
      minZoom={0.15} maxZoom={2} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }}
      onNodeClick={(_, n) => onSelect(n.id)} onPaneClick={() => onSelect(null)} colorMode="dark">
      <FitRoute path={path} count={placed.size} />
      <Background color="#2a2140" gap={32} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
