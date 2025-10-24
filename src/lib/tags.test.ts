import { describe, it, expect } from 'vitest'
import { parseTags, hasTag, stripTags, getTags } from './tags'

describe('Tags', () => {
  it('should parse tags from text', () => {
    const result = parseTags('The cursor twitches [loud] when you stop watching.')
    
    expect(result.text).toBe('The cursor twitches when you stop watching.')
    expect(result.tags).toEqual(['loud'])
  })

  it('should parse multiple tags', () => {
    const result = parseTags('Something is typing [soft] [loop] with you.')
    
    expect(result.text).toBe('Something is typing with you.')
    expect(result.tags).toEqual(['soft', 'loop'])
  })

  it('should handle case insensitive tags', () => {
    const result = parseTags('A message waits [LOUD] in the static.')
    
    expect(result.text).toBe('A message waits in the static.')
    expect(result.tags).toEqual(['loud'])
  })

  it('should handle text without tags', () => {
    const result = parseTags('The soil whispers in binary.')
    
    expect(result.text).toBe('The soil whispers in binary.')
    expect(result.tags).toEqual([])
  })

  it('should check if text has specific tag', () => {
    expect(hasTag('The cursor twitches [loud]', 'loud')).toBe(true)
    expect(hasTag('The cursor twitches [loud]', 'soft')).toBe(false)
    expect(hasTag('No tags here', 'loud')).toBe(false)
  })

  it('should strip tags from text', () => {
    expect(stripTags('The cursor twitches [loud] when you stop watching.')).toBe('The cursor twitches when you stop watching.')
    expect(stripTags('No tags here')).toBe('No tags here')
  })

  it('should get tags from text', () => {
    expect(getTags('The cursor twitches [loud] [soft]')).toEqual(['loud', 'soft'])
    expect(getTags('No tags here')).toEqual([])
  })
})
