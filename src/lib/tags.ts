// Canonical tag taxonomy. Free-text tags are folded into these labels before being saved, so the
// database scoring (exact, case-insensitive overlap) treats "ML", "machine learning" and "AI" as one tag.

interface Canon { label: string; aliases: string[] }

const INTEREST_SKILL: Canon[] = [
  { label: 'AI & ML', aliases: ['ai', 'ml', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'llms', 'nlp', 'computer vision', 'generative ai', 'neural networks'] },
  { label: 'Fintech & Finance', aliases: ['fintech', 'finance', 'financial', 'financial technology', 'payments', 'banking', 'investing', 'trading', 'accounting', 'venture capital', 'vc', 'private equity'] },
  { label: 'Climate & Energy', aliases: ['climate', 'climate tech', 'cleantech', 'sustainability', 'energy', 'renewables', 'green'] },
  { label: 'Healthcare & Biotech', aliases: ['healthcare', 'health', 'health tech', 'biotech', 'medicine', 'medical', 'biology', 'pharma', 'genetics'] },
  { label: 'Design & UX', aliases: ['design', 'ux', 'ui', 'ui/ux', 'product design', 'graphic design', 'branding', 'brand design', 'figma'] },
  { label: 'Frontend & Web', aliases: ['frontend', 'front end', 'web', 'web development', 'react', 'javascript', 'typescript', 'html', 'css', 'nextjs'] },
  { label: 'Backend & Infra', aliases: ['backend', 'back end', 'infrastructure', 'infra', 'devops', 'cloud', 'databases', 'distributed systems', 'api', 'apis', 'sre'] },
  { label: 'Mobile', aliases: ['mobile', 'ios', 'android', 'swift', 'flutter', 'react native'] },
  { label: 'Data & Analytics', aliases: ['data', 'data science', 'analytics', 'data engineering', 'statistics', 'sql', 'bi'] },
  { label: 'Product', aliases: ['product', 'product management', 'pm', 'product manager', 'roadmapping'] },
  { label: 'Marketing & Growth', aliases: ['marketing', 'growth', 'seo', 'social media', 'community', 'advertising', 'pr'] },
  { label: 'Sales & Partnerships', aliases: ['sales', 'business development', 'bizdev', 'partnerships', 'b2b'] },
  { label: 'Strategy & Operations', aliases: ['strategy', 'operations', 'ops', 'consulting', 'management', 'project management', 'logistics', 'supply chain'] },
  { label: 'Robotics & Hardware', aliases: ['robotics', 'hardware', 'iot', 'embedded', 'electronics', 'mechatronics', 'mechanical engineering', 'drones'] },
  { label: 'Gaming', aliases: ['gaming', 'games', 'game dev', 'game development', 'esports', 'unity'] },
  { label: 'Consumer & Social', aliases: ['consumer', 'social', 'social apps', 'ecommerce', 'e-commerce', 'retail'] },
  { label: 'Education', aliases: ['education', 'edtech', 'teaching', 'learning', 'students', 'tutoring'] },
  { label: 'Open Source', aliases: ['open source', 'oss', 'opensource', 'github'] },
  { label: 'Security', aliases: ['security', 'cybersecurity', 'infosec', 'privacy', 'cryptography'] },
  { label: 'Crypto & Web3', aliases: ['crypto', 'web3', 'blockchain', 'defi', 'ethereum', 'bitcoin'] },
  { label: 'Quantum & Physics', aliases: ['quantum', 'physics', 'quantum computing'] },
  { label: 'Research & Science', aliases: ['research', 'science', 'academia', 'phd', 'lab'] },
  { label: 'Real Estate', aliases: ['real estate', 'property', 'proptech'] },
  { label: 'Manufacturing', aliases: ['manufacturing', 'industrial', 'hardware manufacturing', 'factory'] },
  { label: 'Media & Content', aliases: ['media', 'content', 'content creation', 'writing', 'video', 'podcast', 'journalism', 'film', 'music'] },
  { label: 'Leadership', aliases: ['leadership', 'people management', 'team building', 'hiring managers'] },
  { label: 'Entrepreneurship', aliases: ['entrepreneurship', 'startups', 'startup', 'founder', 'founding', 'bootstrapping'] },
]

const GOALS: Canon[] = [
  { label: 'Find a cofounder', aliases: ['cofounder', 'co-founder', 'find cofounder', 'find a cofounder', 'find co-founder', 'founding partner'] },
  { label: 'Find investors', aliases: ['investors', 'find investors', 'funding', 'raise money', 'raise funding', 'fundraising', 'seed funding'] },
  { label: 'Find mentors', aliases: ['mentor', 'mentors', 'mentorship', 'find a mentor', 'advice', 'guidance'] },
  { label: 'Mentor others', aliases: ['mentor others', 'mentoring', 'give back', 'teach'] },
  { label: 'Hire talent', aliases: ['hire', 'hiring', 'hire engineers', 'hire talent', 'recruit', 'recruiting', 'find employees'] },
  { label: 'Get hired', aliases: ['get hired', 'job', 'find a job', 'internship', 'jobs', 'career', 'find work', 'looking for work'] },
  { label: 'Find customers', aliases: ['customers', 'find customers', 'clients', 'find clients', 'first customers', 'users'] },
  { label: 'Research collaborators', aliases: ['research collaborators', 'collaborators', 'collaborate', 'research partners', 'co-authors'] },
  { label: 'Learn new skills', aliases: ['learn', 'learning', 'learn new skills', 'upskill', 'grow my skills'] },
  { label: 'Make friends', aliases: ['friends', 'make friends', 'find a friend', 'community', 'meet people', 'networking', 'expand network'] },
]

export const INTEREST_OPTIONS = INTEREST_SKILL.map((c) => c.label)
export const GOAL_OPTIONS = GOALS.map((c) => c.label)

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#/&.\s-]/g, ' ').replace(/\s+/g, ' ').trim()
const SQUASH = (s: string) => s.replace(/[\s.-]/g, '')

function build(list: Canon[]) {
  const exact = new Map<string, string>()
  for (const c of list) { exact.set(clean(c.label), c.label); exact.set(SQUASH(clean(c.label)), c.label); for (const a of c.aliases) { exact.set(clean(a), c.label); exact.set(SQUASH(clean(a)), c.label) } }
  const phrases = [...exact.entries()].filter(([k]) => k.includes(' ')).sort((a, b) => b[0].length - a[0].length)
  return { exact, phrases }
}
const IDX = { interest: build(INTEREST_SKILL), goal: build(GOALS) }

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (m) => m.toUpperCase())

/** Folds a free-text tag into its canonical label, or keeps it as a tidy custom tag. */
export function canonicalTag(raw: string, kind: 'interest' | 'goal' = 'interest'): string {
  const c = clean(raw)
  if (!c) return ''
  const { exact, phrases } = IDX[kind]
  const hit = exact.get(c) ?? exact.get(SQUASH(c))
  if (hit) return hit
  // A multi-word alias appearing inside a longer phrase ("loves machine learning research").
  const padded = ` ${c} `
  for (const [phrase, label] of phrases) if (padded.includes(` ${phrase} `)) return label
  // A single known word inside the phrase ("react developer" -> Frontend & Web).
  for (const w of c.split(' ')) { const h = exact.get(w); if (h && w.length > 2) return h }
  return titleCase(c).slice(0, 40)
}

export function canonicalTags(raws: string[], kind: 'interest' | 'goal' = 'interest'): string[] {
  return [...new Set(raws.map((r) => canonicalTag(r, kind)).filter(Boolean))].slice(0, 12)
}
