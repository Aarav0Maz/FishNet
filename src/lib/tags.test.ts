import { describe, expect, it } from 'vitest'
import { canonicalTag, canonicalTags } from './tags'

describe('canonicalTag', () => {
  it('folds synonyms into one label', () => {
    for (const t of ['AI', 'ml', 'Machine Learning', 'LLMs', 'artificial intelligence']) expect(canonicalTag(t)).toBe('AI & ML')
    expect(canonicalTag('Fintech')).toBe(canonicalTag('finance'))
    expect(canonicalTag('react')).toBe('Frontend & Web')
  })
  it('handles phrases containing an alias', () => {
    expect(canonicalTag('machine learning research')).toBe('AI & ML')
    expect(canonicalTag('react developer')).toBe('Frontend & Web')
  })
  it('keeps unknown tags tidy', () => expect(canonicalTag('  underwater basket weaving ')).toBe('Underwater Basket Weaving'))
  it('canonicalizes goals separately', () => {
    expect(canonicalTag('cofounder', 'goal')).toBe('Find a cofounder')
    expect(canonicalTag('Find cofounder', 'goal')).toBe('Find a cofounder')
    expect(canonicalTag('hire engineers', 'goal')).toBe('Hire talent')
  })
  it('dedupes and caps', () => {
    expect(canonicalTags(['AI', 'ml', 'Machine learning'])).toEqual(['AI & ML'])
    expect(canonicalTags(Array.from({ length: 30 }, (_, i) => `custom ${i}`))).toHaveLength(12)
  })
})
