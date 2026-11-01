import type { Tags } from '../types'

/** Shortest path (by hops) over an undirected edge list. Returns node ids from..to, or null. */
export function shortestPath(edges: readonly (readonly [string, string])[], from: string, to: string): string[] | null {
  if (from === to) return [from]
  const adj = new Map<string, string[]>()
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a)!.push(b)
    adj.get(b)!.push(a)
  }
  if (!adj.has(from) || !adj.has(to)) return null
  const prev = new Map<string, string>([[from, from]])
  const queue = [from]
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]
    for (const nxt of adj.get(cur) ?? []) {
      if (prev.has(nxt)) continue
      prev.set(nxt, cur)
      if (nxt === to) {
        const path = [to]
        let c = to
        while (c !== from) { c = prev.get(c)!; path.push(c) }
        return path.reverse()
      }
      queue.push(nxt)
    }
  }
  return null
}

const norm = (s: string) => s.trim().toLowerCase()
const overlap = (a: string[], b: string[]) => {
  const set = new Set(a.map(norm))
  return new Set(b.map(norm).filter((x) => set.has(x))).size
}

/** Deterministic relevance. Mirrored by discover_page() in SQL; keep in sync. */
export function matchScore(me: Tags, other: Tags): number {
  return 3 * overlap(me.interests, other.interests) + 2 * overlap(me.skills, other.interests) + 2 * overlap(me.interests, other.skills) + overlap(me.goals, other.goals)
}

export function parseTags(s: string): string[] {
  return [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))].slice(0, 12)
}
