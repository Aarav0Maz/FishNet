// Pure scoring helpers for the load-test task. Same weights as src/lib/graph.ts matchScore and discover_page() in SQL.
export interface Tags { skills: string[]; interests: string[]; goals: string[] }

const TOPICS = ['AI & ML', 'Fintech & Finance', 'Climate & Energy', 'Healthcare & Biotech', 'Design & UX', 'Frontend & Web', 'Backend & Infra', 'Data & Analytics', 'Product', 'Marketing & Growth', 'Robotics & Hardware', 'Gaming']
const GOALS = ['Find a cofounder', 'Find investors', 'Find mentors', 'Hire talent', 'Get hired', 'Find customers']

/** Deterministic pseudo-random generator (mulberry32), so a shard's result never changes for the same seed. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function syntheticProfiles(seed: number, n: number): Tags[] {
  const r = rng(seed)
  const pick = (list: string[], k: number) => { const out = new Set<string>(); while (out.size < k) out.add(list[Math.floor(r() * list.length)]); return [...out] }
  return Array.from({ length: n }, () => ({ skills: pick(TOPICS, 2), interests: pick(TOPICS, 3), goals: pick(GOALS, 1) }))
}

const overlap = (a: string[], b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n }

export function scoreAllPairs(profiles: Tags[]): { pairs: number; best: number; bestPair: [number, number] } {
  const sets = profiles.map((p) => ({ i: new Set(p.interests), s: new Set(p.skills), g: new Set(p.goals) }))
  let pairs = 0, best = -1, bestPair: [number, number] = [0, 0]
  for (let x = 0; x < profiles.length; x++) for (let y = x + 1; y < profiles.length; y++) {
    const A = profiles[x], B = profiles[y]
    const score = 3 * overlap(A.interests, sets[y].i) + 2 * overlap(A.skills, sets[y].i) + 2 * overlap(A.interests, sets[y].s) + overlap(A.goals, sets[y].g)
    pairs++
    if (score > best) { best = score; bestPair = [x, y] }
  }
  return { pairs, best, bestPair }
}
