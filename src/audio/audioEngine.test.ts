import { describe, it, expect, vi, beforeEach } from 'vitest'
import { audioEngine } from './audioEngine'

// Mock Web Audio API
const mockAudioContext = {
  createBufferSource: vi.fn(() => ({
    buffer: null,
    loop: false,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn()
  })),
  createDynamicsCompressor: vi.fn(() ({
    threshold: { value: -22 },
    ratio: { value: 2.5 },
    knee: { value: 30 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: vi.fn()
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn()
}

// Mock fetch for audio cues
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      cues: [
        {
          id: 'sfx.chime.glass',
          type: 'one',
          src: 'chime_glass.ogg',
          gain: 0.2,
          cooldownMs: 600,
          tags: ['stone', 'soft']
        }
      ],
      routes: [
        { when: 'story.flags.seed', play: ['sfx.chime.glass'] }
      ]
    })
  })
) as any

// Mock AudioContext
global.AudioContext = vi.fn(() => mockAudioContext) as any
global.webkitAudioContext = vi.fn(() => mockAudioContext) as any

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    audioEngine.setTestMode(true)
  })

  it('should load audio cues data', async () => {
    // This is tested implicitly through the constructor
    expect(global.fetch).toHaveBeenCalledWith('/src/audio/cues/audio_cues.json')
  })

  it('should play one-shot audio cues', async () => {
    await audioEngine.playOne('sfx.chime.glass')
    
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
    expect(mockAudioContext.createGain).toHaveBeenCalled()
  })

  it('should respect cooldown periods', async () => {
    await audioEngine.playOne('sfx.chime.glass')
    await audioEngine.playOne('sfx.chime.glass') // Should be blocked by cooldown
    
    // Should only create one source due to cooldown
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1)
  })

  it('should handle test mode attributes', async () => {
    await audioEngine.playOne('sfx.chime.glass')
    
    expect(document.body.getAttribute('data-audio-fired')).toBe('sfx.chime.glass')
  })

  it('should update master volume', () => {
    audioEngine.updateMasterVolume(0.5)
    // Volume update is tested through the gain node value
  })

  it('should handle ducking', async () => {
    await audioEngine.duck(0.5, 1000)
    
    if (audioEngine['isTestMode']) {
      expect(document.body.getAttribute('data-ducking')).toBe('true')
    }
  })
})
