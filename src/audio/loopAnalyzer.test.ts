import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoopAnalyzer } from './loopAnalyzer'

// Mock fs for Node.js environment
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}))

describe('LoopAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect percussive sounds as non-loopable', async () => {
    const result = await LoopAnalyzer.analyzeLoop('chime_glass.ogg')
    
    expect(result.isLoopable).toBe(false)
    expect(result.confidence).toBe(1.0)
  })

  it('should detect drone sounds as loopable', async () => {
    const result = await LoopAnalyzer.analyzeLoop('drone_low.ogg')
    
    expect(result.isLoopable).toBe(true)
    expect(result.loopStart).toBeGreaterThanOrEqual(0)
    expect(result.loopEnd).toBeGreaterThan(0)
    expect(result.crossfadeMs).toBeGreaterThan(0)
  })

  it('should handle short duration files as non-loopable', async () => {
    const result = await LoopAnalyzer.analyzeLoop('pulse_heart.ogg')
    
    expect(result.isLoopable).toBe(false)
  })

  it('should provide fallback metadata for unsupported formats', async () => {
    const result = await LoopAnalyzer.analyzeLoop('unknown.mp3')
    
    expect(result).toMatchObject({
      loopStart: 0,
      loopEnd: expect.any(Number),
      crossfadeMs: expect.any(Number),
      isLoopable: true,
      confidence: 0.3,
      duration: 1.0
    })
  })

  it('should handle analysis errors gracefully', async () => {
    // Mock fs.readFileSync to throw an error
    const fs = await import('fs')
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('File not found')
    })

    const result = await LoopAnalyzer.analyzeLoop('nonexistent.wav')
    
    expect(result).toMatchObject({
      loopStart: 0,
      loopEnd: expect.any(Number),
      crossfadeMs: expect.any(Number),
      isLoopable: true,
      confidence: 0.3,
      duration: 1.0
    })
  })
})
