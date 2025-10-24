import { createNanoEvents } from 'nanoevents'

export interface FXEventMap {
  'entropy.enter.40': void
  'entropy.enter.60': void
  'entropy.enter.80': void
  'entropy.enter.90': void
  'entropy.exit.40': void
  'entropy.exit.60': void
  'entropy.exit.80': void
  'entropy.exit.90': void
  'entropy.tick.fast': void
  'entropy.tick.normal': void
  'entropy.seizure': void
  'ui.choice.open': void
  'corruption.inject': { text: string; tags: string[] }
  'omen.trigger': void
}

class FXBus {
  private emitter = createNanoEvents<FXEventMap>()

  on<K extends keyof FXEventMap>(event: K, callback: (payload: FXEventMap[K]) => void) {
    return this.emitter.on(event, callback)
  }

  emit<K extends keyof FXEventMap>(event: K, payload: FXEventMap[K]) {
    this.emitter.emit(event, payload)
  }

  off<K extends keyof FXEventMap>(event: K, callback: (payload: FXEventMap[K]) => void) {
    this.emitter.off(event, callback)
  }
}

export const fxBus = new FXBus()
