import type { Persona, Tags } from '../types'

const norm = (s: string) => s.trim().toLowerCase()
const shared = (a: string[], b: string[]) => { const s = new Set(a.map(norm)); return [...new Set(b.filter((x) => s.has(norm(x))))] }

/** Deterministic icebreakers from overlapping tags, plus one in-character line. No AI involved. */
export function conversationStarters(me: Tags, other: Tags, persona: Persona): string[] {
  const out: string[] = []
  const si = shared(me.interests, other.interests)
  if (si[0]) out.push(`You both care about ${si[0]}. Ask what pulled them into it.`)
  const theirSkillMyInterest = shared(me.interests, other.skills)
  if (theirSkillMyInterest[0]) out.push(`They do ${theirSkillMyInterest[0]}, which you are curious about. Ask how they got started.`)
  const mySkillTheirInterest = shared(me.skills, other.interests)
  if (mySkillTheirInterest[0]) out.push(`They are into ${mySkillTheirInterest[0]} and you have that skill. Offer to compare notes.`)
  const sg = shared(me.goals, other.goals)
  if (sg[0]) out.push(`You are both looking to ${sg[0].toLowerCase()}. Swap what is working.`)
  out.push(`Open in character: "${persona.company}${persona.valuation ? ` at ${persona.valuation}` : ''}? Impressive. What is the actual secret?"`)
  return out.slice(0, 3)
}
