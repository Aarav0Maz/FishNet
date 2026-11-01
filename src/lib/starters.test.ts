import { describe, expect, it } from 'vitest'
import { conversationStarters } from './starters'

const persona = { template: 'vc', name: 'Sloane', title: 'MP', company: 'Ashcroft Ventures', bio: '', valuation: '$900M', hue: 270 }
describe('conversationStarters', () => {
  it('uses shared interests and always ends with an in-character opener', () => {
    const s = conversationStarters({ skills: [], interests: ['AI'], goals: [] }, { skills: [], interests: ['ai'], goals: [] }, persona)
    expect(s[0]).toMatch(/care about AI|care about ai/i)
    expect(s.at(-1)).toContain('Ashcroft Ventures')
  })
  it('still returns an opener with no overlap, capped at three', () => {
    const none = conversationStarters({ skills: [], interests: [], goals: [] }, { skills: [], interests: [], goals: [] }, persona)
    expect(none).toHaveLength(1)
    const all = conversationStarters({ skills: ['ux'], interests: ['AI', 'ux'], goals: ['hire'] }, { skills: ['AI'], interests: ['AI', 'ux'], goals: ['Hire'] }, persona)
    expect(all.length).toBeLessThanOrEqual(3)
  })
})
