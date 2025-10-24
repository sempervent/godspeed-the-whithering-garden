import { describe, it, expect } from 'vitest'
import { StoryEngine } from '../lib/storyEngine'

describe('StoryEngine', () => {
  const engine = new StoryEngine()

  it('applies entropy corruption to text', () => {
    const text = 'Hello world'
    const corrupted = engine.applyEntropy(text, 50)
    
    // Should return a string
    expect(typeof corrupted).toBe('string')
    
    // With low entropy, should return original text
    const lowEntropy = engine.applyEntropy(text, 5)
    expect(lowEntropy).toBe(text)
  })

  it('returns next line correctly', () => {
    const line1 = engine.nextLine(0)
    expect(line1.text).toBeDefined()
    
    const line2 = engine.nextLine(1)
    expect(line2.text).toBeDefined()
    expect(line2.text).not.toBe(line1.text)
  })

  it('handles out of bounds line index', () => {
    const outOfBounds = engine.nextLine(999)
    expect(outOfBounds.text).toBe('Loading...')
  })

  it('loads story successfully', async () => {
    const story = await engine.loadStory()
    expect(story).toBeDefined()
    expect(story.title).toBeDefined()
    expect(story.lines).toBeDefined()
    expect(Array.isArray(story.lines)).toBe(true)
  })

  it('applies entropy with high values', () => {
    const text = 'The garden grows'
    const highEntropy = engine.applyEntropy(text, 80)
    
    // Should potentially corrupt the text
    expect(typeof highEntropy).toBe('string')
    expect(highEntropy.length).toBeGreaterThan(0)
  })
})
