import { createNanoEvents } from 'nanoevents'

export interface AudioEventMap {
  'entropy.enter.40': void
  'entropy.enter.60': void
  'entropy.enter.80': void
  'entropy.enter.90': void
  'entropy.exit.40': void
  'entropy.exit.60': void
  'entropy.exit.80': void
  'entropy.exit.90': void
  'entropy.tick.fast': void
  'entropy.seizure': void
  'story.flags.seed': void
  'story.flags.awaken': void
  'ui.choice.open': void
  'corruption.tag.soft': void
  'corruption.tag.loud': void
  'corruption.tag.loop': void
  'corruption.tag.mirror': void
  'corruption.inject': { text: string; tags: string[] }
  'omen.trigger': void
}

class AudioBus {
  private emitter = createNanoEvents<AudioEventMap>()

  on<K extends keyof AudioEventMap>(event: K, callback: (payload: AudioEventMap[K]) => void) {
    return this.emitter.on(event, callback)
  }

  emit<K extends keyof AudioEventMap>(event: K, payload: AudioEventMap[K]) {
    this.emitter.emit(event, payload)
  }

  off<K extends keyof AudioEventMap>(event: K, callback: (payload: AudioEventMap[K]) => void) {
    this.emitter.off(event, callback)
  }
}

export const audioBus = new AudioBus()
