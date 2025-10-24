import { audioBus } from './audioBus'
import { userSettings } from '../settings/userSettings'

export interface AudioCue {
  id: string
  type: 'loop' | 'one'
  src: string
  gain: number
  entropyMin?: number
  entropyMax?: number
  rateVar?: [number, number]
  cooldownMs?: number
  tags: string[]
  duckOn?: string[]
  sidechainOn?: string[]
  crossfadeFrom?: string
  loopStart?: number
  loopEnd?: number
  crossfadeMs?: number
  isLoopable?: boolean
}

export interface AudioRoute {
  when: string
  play?: string[]
  stop?: string[]
  duck?: number
  forMs?: number
}

export interface AudioCuesData {
  cues: AudioCue[]
  routes: AudioRoute[]
}

class AudioEngine {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private bufferCache = new Map<string, AudioBuffer>()
  private activeLoops = new Map<string, AudioBufferSourceNode>()
  private cooldowns = new Map<string, number>()
  private cuesData: AudioCuesData | null = null
  private loopMetadata = new Map<string, any>()
  private isTestMode = false

  constructor() {
    this.loadCuesData()
    this.loadLoopMetadata()
    this.setupEventListeners()
  }

  private async loadCuesData() {
    try {
      const response = await fetch('/audio_cues.json')
      this.cuesData = await response.json()
      console.log('✅ Audio cues loaded:', this.cuesData?.cues.length, 'cues')
    } catch (error) {
      console.warn('Failed to load audio cues:', error)
    }
  }

  private async loadLoopMetadata() {
    try {
      const response = await fetch('/dist/loop_meta.json')
      if (response.ok) {
        const metadata = await response.json()
        this.loopMetadata = new Map(Object.entries(metadata))
        console.log('✅ Loop metadata loaded:', this.loopMetadata.size, 'files')
      } else {
        console.warn('Loop metadata not found, using defaults')
      }
    } catch (error) {
      console.warn('Failed to load loop metadata:', error)
    }
  }

  private setupEventListeners() {
    // Listen to all audio events and apply routes
    const events = [
      'entropy.enter.40', 'entropy.enter.60', 'entropy.enter.80', 'entropy.enter.90',
      'entropy.exit.40', 'entropy.exit.60', 'entropy.exit.80', 'entropy.exit.90',
      'entropy.tick.fast', 'entropy.tick.normal', 'entropy.seizure',
      'story.flags.seed', 'story.flags.awaken',
      'ui.choice.open',
      'corruption.tag.soft', 'corruption.tag.loud', 'corruption.tag.loop', 'corruption.tag.mirror',
      'corruption.inject',
      'omen.trigger',
      // New mechanics events
      'seed.spawn', 'seed.expire', 'seed.click.viable', 'seed.click.rot',
      'god.spawn', 'god.bargain.open',
      'god.boon.Harvest', 'god.boon.Stillness', 'god.boon.Veil', 'god.boon.Echo',
      'god.price.TithedBreath', 'god.price.StoneDue', 'god.price.AshTax', 'god.price.DreamDebt',
      'entropy.tier.enter.Dormant', 'entropy.tier.enter.Breath', 'entropy.tier.enter.Pulse', 
      'entropy.tier.enter.Fever', 'entropy.tier.enter.Famine', 'entropy.tier.enter.Seizure',
      'entropy.tier.exit.Dormant', 'entropy.tier.exit.Breath', 'entropy.tier.exit.Pulse',
      'entropy.tier.exit.Fever', 'entropy.tier.exit.Famine', 'entropy.tier.exit.Seizure',
      // Persistent ecology events
      'seed.feed', 'seed.starve', 'seed.mature', 'god.awaken',
      'season.enter.SPRING', 'season.enter.SUMMER', 'season.enter.AUTUMN', 'season.enter.WINTER',
      'ending.AscendantChorus', 'ending.GardenFamine', 'ending.StoneSleep'
    ]
    
    events.forEach(event => {
      audioBus.on(event as any, (payload: any) => {
        this.applyRoutes(event, payload)
      })
    })
  }

  private async initializeContext() {
    if (this.context) return

    console.log('🎵 Initializing audio context...')
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    console.log('🎵 Audio context created:', this.context.state)
    
    // Create master gain
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = userSettings.getMasterVolume()

    // Create compressor
    this.compressor = this.context.createDynamicsCompressor()
    this.compressor.threshold.value = -22
    this.compressor.ratio.value = 2.5
    this.compressor.knee.value = 30
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.25

    // Connect nodes
    this.compressor.connect(this.masterGain)
    this.masterGain.connect(this.context.destination)

    // Resume context if suspended
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    
    console.log('✅ Audio context initialized:', this.context.state)
  }

  private async loadBuffer(src: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(src)) {
      return this.bufferCache.get(src)!
    }

    if (!this.context) await this.initializeContext()
    if (!this.context) return null

    try {
      const response = await fetch(`/src/audio/cues/assets/${src}`)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
      this.bufferCache.set(src, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.warn(`Failed to load audio buffer: ${src}`, error)
      return null
    }
  }

  private applyRoutes(event: string, payload?: any) {
    if (!this.cuesData) {
      console.log('⚠️ Audio cues data not loaded yet')
      return
    }

    const routes = this.cuesData.routes.filter(route => route.when === event)
    console.log(`🎵 Audio event: ${event}, found ${routes.length} routes`)

    for (const route of routes) {
      if (route.play) {
        console.log(`🎵 Playing cues:`, route.play)
        route.play.forEach(cueId => {
          console.log(`🎵 Attempting to play: ${cueId}`)
          this.playOne(cueId)
        })
      }
      if (route.stop) {
        console.log(`🎵 Stopping cues:`, route.stop)
        route.stop.forEach(cueId => this.stopLoop(cueId))
      }
      if (route.duck && route.forMs) {
        console.log(`🎵 Ducking audio by ${route.duck} for ${route.forMs}ms`)
        this.duck(route.duck, route.forMs)
      }
    }
  }

  async playOne(cueId: string, options?: { rate?: number; gain?: number }) {
    if (userSettings.isMuted()) {
      console.log('🔇 Audio muted, skipping playOne')
      return
    }

    const cue = this.cuesData?.cues.find(c => c.id === cueId)
    if (!cue || cue.type !== 'one') {
      console.log(`⚠️ Cue not found or wrong type: ${cueId}`)
      return
    }
    
    console.log(`🎵 Playing one-shot: ${cueId} (${cue.src})`)

    // Check cooldown
    const now = Date.now()
    if (this.cooldowns.has(cueId)) {
      const lastPlayed = this.cooldowns.get(cueId)!
      if (now - lastPlayed < (cue.cooldownMs || 0)) return
    }

    if (!this.context) await this.initializeContext()
    if (!this.context) return

    const buffer = await this.loadBuffer(cue.src)
    if (!buffer) return

    const source = this.context.createBufferSource()
    source.buffer = buffer

    // Apply rate variation
    if (cue.rateVar) {
      const [min, max] = cue.rateVar
      source.playbackRate.value = min + Math.random() * (max - min)
    } else if (options?.rate) {
      source.playbackRate.value = options.rate
    }

    // Create gain node
    const gainNode = this.context.createGain()
    gainNode.gain.value = (options?.gain || cue.gain) * userSettings.getMasterVolume()

    // Connect
    source.connect(gainNode)
    gainNode.connect(this.compressor!)

    // Play
    source.start()
    this.cooldowns.set(cueId, now)

    // Set test mode attributes for E2E testing
    if (this.isTestMode) {
      document.body.setAttribute('data-audio-fired', cueId)
      setTimeout(() => document.body.removeAttribute('data-audio-fired'), 1000)
    }
  }

  async ensureLoop(cueId: string) {
    if (userSettings.isMuted()) return

    const cue = this.cuesData?.cues.find(c => c.id === cueId)
    if (!cue || cue.type !== 'loop') return

    // Stop existing loop if playing
    this.stopLoop(cueId)

    if (!this.context) await this.initializeContext()
    if (!this.context) return

    const buffer = await this.loadBuffer(cue.src)
    if (!buffer) return

    const source = this.context.createBufferSource()
    source.buffer = buffer

    // Apply loop metadata if available
    const loopMeta = this.loopMetadata.get(cue.src)
    if (loopMeta && loopMeta.isLoopable) {
      source.loop = true
      source.loopStart = loopMeta.loopStart / buffer.sampleRate
      source.loopEnd = loopMeta.loopEnd / buffer.sampleRate
    } else {
      // Fallback to full buffer loop
      source.loop = true
    }

    // Create gain node
    const gainNode = this.context.createGain()
    gainNode.gain.value = cue.gain * userSettings.getMasterVolume()

    // Connect
    source.connect(gainNode)
    gainNode.connect(this.compressor!)

    // Start loop
    source.start()
    this.activeLoops.set(cueId, source)

    // Set test mode attributes
    if (this.isTestMode) {
      document.body.setAttribute('data-audio-active', cueId)
      if (loopMeta) {
        document.body.setAttribute('data-loop-start', loopMeta.loopStart.toString())
        document.body.setAttribute('data-loop-end', loopMeta.loopEnd.toString())
        document.body.setAttribute('data-crossfade-ms', loopMeta.crossfadeMs.toString())
      }
    }
  }

  stopLoop(cueId: string) {
    const source = this.activeLoops.get(cueId)
    if (source) {
      try {
        source.stop()
      } catch (error) {
        // Source might already be stopped
      }
      this.activeLoops.delete(cueId)
    }

    if (this.isTestMode) {
      document.body.removeAttribute('data-audio-active')
    }
  }

  async duck(amount: number, durationMs: number) {
    if (!this.masterGain) return

    const originalGain = this.masterGain.gain.value
    const duckedGain = originalGain * amount

    // Duck
    this.masterGain.gain.setValueAtTime(originalGain, this.context!.currentTime)
    this.masterGain.gain.linearRampToValueAtTime(duckedGain, this.context!.currentTime + 0.1)

    // Restore
    setTimeout(() => {
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(duckedGain, this.context!.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(originalGain, this.context!.currentTime + 0.3)
      }
    }, durationMs)

    if (this.isTestMode) {
      document.body.setAttribute('data-ducking', 'true')
      setTimeout(() => document.body.setAttribute('data-ducking', 'false'), durationMs)
    }
  }

  setTestMode(enabled: boolean) {
    this.isTestMode = enabled
  }

  updateMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume
    }
  }

  async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume()
    }
  }

  getLoopMetadata(filename: string) {
    return this.loopMetadata.get(filename)
  }

  getAllLoopMetadata() {
    return Object.fromEntries(this.loopMetadata)
  }
}

export const audioEngine = new AudioEngine()
