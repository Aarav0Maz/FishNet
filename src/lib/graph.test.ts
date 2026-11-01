import { describe, expect, it } from 'vitest'
import { matchScore, shortestPath } from './graph'

const E: [string, string][] = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'x'], ['x', 'd'], ['q', 'r']]
describe('shortestPath', () => {
  it('finds the shortest route', () => expect(shortestPath(E, 'a', 'd')).toEqual(['a', 'x', 'd']))
  it('handles same node', () => expect(shortestPath(E, 'a', 'a')).toEqual(['a']))
  it('returns null when disconnected', () => expect(shortestPath(E, 'a', 'q')).toBeNull())
  it('returns null for unknown nodes', () => expect(shortestPath(E, 'a', 'zzz')).toBeNull())
})
describe('matchScore', () => {
  const me = { skills: ['AI'], interests: ['Climate', 'Design'], goals: ['Cofounder'] }
  it('is deterministic and case-insensitive', () => {
    const o = { skills: ['design'], interests: ['ai', 'climate'], goals: ['cofounder'] }
    expect(matchScore(me, o)).toBe(3 + 2 + 2 + 1)
    expect(matchScore(me, o)).toBe(matchScore(me, o))
  })
  it('is zero without overlap', () => expect(matchScore(me, { skills: [], interests: [], goals: [] })).toBe(0))
})
