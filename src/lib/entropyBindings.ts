import { audioBus } from '../audio/audioBus'
import { fxBus } from '../fx/fxBus'

interface EntropyThresholds {
  shimmer: number
  flicker: number
  intense: number
  seizure: number
}

const THRESHOLDS: EntropyThresholds = {
  shimmer: 40,
  flicker: 60,
  intense: 80,
  seizure: 90
}

class EntropyBindings {
  private lastEntropy = 0
  private clickHistory: number[] = []
  private readonly CLICK_BURST_WINDOW = 800 // ms
  private readonly CLICK_BURST_THRESHOLD = 3 // clicks

  constructor() {
    this.setupClickTracking()
  }

  private setupClickTracking() {
    // Track clicks globally for burst detection
    document.addEventListener('click', () => {
      this.recordClick()
    })

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        this.recordClick()
      }
    })
  }

  private recordClick() {
    const now = Date.now()
    this.clickHistory.push(now)
    
    // Remove old clicks outside the window
    this.clickHistory = this.clickHistory.filter(
      timestamp => now - timestamp <= this.CLICK_BURST_WINDOW
    )

    // Check for burst
    if (this.clickHistory.length >= this.CLICK_BURST_THRESHOLD) {
      audioBus.emit('entropy.tick.fast', undefined)
    }
  }

  updateEntropy(newEntropy: number) {
    const oldEntropy = this.lastEntropy
    this.lastEntropy = newEntropy

    // Check threshold crossings
    this.checkThresholdCrossing(oldEntropy, newEntropy, THRESHOLDS.shimmer, 'entropy.enter.40', 'entropy.exit.40')
    this.checkThresholdCrossing(oldEntropy, newEntropy, THRESHOLDS.flicker, 'entropy.enter.60', 'entropy.exit.60')
    this.checkThresholdCrossing(oldEntropy, newEntropy, THRESHOLDS.intense, 'entropy.enter.80', 'entropy.exit.80')
    this.checkThresholdCrossing(oldEntropy, newEntropy, THRESHOLDS.seizure, 'entropy.enter.90', 'entropy.exit.90')

    // Check for seizure event (entropy >= 90)
    if (newEntropy >= THRESHOLDS.seizure && oldEntropy < THRESHOLDS.seizure) {
      this.triggerSeizure()
    }
  }

  private checkThresholdCrossing(
    oldValue: number, 
    newValue: number, 
    threshold: number, 
    enterEvent: string, 
    exitEvent: string
  ) {
    if (oldValue < threshold && newValue >= threshold) {
      audioBus.emit(enterEvent as any, undefined)
      fxBus.emit(enterEvent as any, undefined)
    } else if (oldValue >= threshold && newValue < threshold) {
      audioBus.emit(exitEvent as any, undefined)
      fxBus.emit(exitEvent as any, undefined)
    }
  }

  private triggerSeizure() {
    // Emit seizure events
    audioBus.emit('entropy.seizure', undefined)
    fxBus.emit('entropy.seizure', undefined)
  }

  // Story event bindings
  onSeedFlag() {
    console.log('🌱 Emitting seed flag event')
    audioBus.emit('story.flags.seed', undefined)
    fxBus.emit('story.flags.seed', undefined)
  }

  onAwakenFlag() {
    console.log('👁️ Emitting awaken flag event')
    audioBus.emit('story.flags.awaken', undefined)
    fxBus.emit('story.flags.awaken', undefined)
  }

  onChoiceOpen() {
    audioBus.emit('ui.choice.open', undefined)
    fxBus.emit('ui.choice.open', undefined)
  }

  onCorruptionInject(text: string, tags: string[]) {
    audioBus.emit('corruption.inject', { text, tags })
    fxBus.emit('corruption.inject', { text, tags })

    // Emit tag-specific events
    tags.forEach(tag => {
      audioBus.emit(`corruption.tag.${tag}` as any, undefined)
    })
  }

  onEntropyTick(type: 'fast' | 'normal') {
    console.log(`⚡ Emitting entropy tick: ${type}`)
    if (type === 'fast') {
      audioBus.emit('entropy.tick.fast', undefined)
      fxBus.emit('entropy.tick.fast', undefined)
    } else {
      audioBus.emit('entropy.tick.normal', undefined)
      fxBus.emit('entropy.tick.normal', undefined)
    }
  }

  onOmenTrigger() {
    console.log('🌪️ Emitting omen trigger event')
    audioBus.emit('omen.trigger', undefined)
    fxBus.emit('omen.trigger', undefined)
  }

  // New mechanics events
  onSeedSpawn() {
    console.log('🌱 Emitting seed spawn event')
    audioBus.emit('seed.spawn', undefined)
    fxBus.emit('seed.spawn', undefined)
  }

  onSeedExpire() {
    console.log('💀 Emitting seed expire event')
    audioBus.emit('seed.expire', undefined)
    fxBus.emit('seed.expire', undefined)
  }

  onSeedClickViable() {
    console.log('✅ Emitting viable seed click event')
    audioBus.emit('seed.click.viable', undefined)
    fxBus.emit('seed.click.viable', undefined)
  }

  onSeedClickRot() {
    console.log('☠️ Emitting rot seed click event')
    audioBus.emit('seed.click.rot', undefined)
    fxBus.emit('seed.click.rot', undefined)
  }

  onGodSpawn() {
    console.log('👁️ Emitting god spawn event')
    audioBus.emit('god.spawn', undefined)
    fxBus.emit('god.spawn', undefined)
  }

  onGodBargainOpen() {
    console.log('🤝 Emitting god bargain open event')
    audioBus.emit('god.bargain.open', undefined)
    fxBus.emit('god.bargain.open', undefined)
  }

  onBoonApplied(boon: string) {
    console.log(`🎁 Emitting boon applied: ${boon}`)
    audioBus.emit(`god.boon.${boon}` as any, undefined)
    fxBus.emit(`god.boon.${boon}` as any, undefined)
  }

  onPriceApplied(price: string) {
    console.log(`💰 Emitting price applied: ${price}`)
    audioBus.emit(`god.price.${price}` as any, undefined)
    fxBus.emit(`god.price.${price}` as any, undefined)
  }

  onEntropyTierEnter(tier: string) {
    console.log(`📊 Emitting entropy tier enter: ${tier}`)
    audioBus.emit(`entropy.tier.enter.${tier}` as any, undefined)
    fxBus.emit(`entropy.tier.enter.${tier}` as any, undefined)
  }

  onEntropyTierExit(tier: string) {
    console.log(`📊 Emitting entropy tier exit: ${tier}`)
    audioBus.emit(`entropy.tier.exit.${tier}` as any, undefined)
    fxBus.emit(`entropy.tier.exit.${tier}` as any, undefined)
  }

  // Persistent ecology events
  onSeedFeed() {
    console.log('🌱 Emitting seed feed event')
    audioBus.emit('seed.feed', undefined)
    fxBus.emit('seed.feed', undefined)
  }

  onSeedStarve() {
    console.log('💀 Emitting seed starve event')
    audioBus.emit('seed.starve', undefined)
    fxBus.emit('seed.starve', undefined)
  }

  onSeedMature() {
    console.log('🌿 Emitting seed mature event')
    audioBus.emit('seed.mature', undefined)
    fxBus.emit('seed.mature', undefined)
  }

  onGodAwaken() {
    console.log('👁️ Emitting god awaken event')
    audioBus.emit('god.awaken', undefined)
    fxBus.emit('god.awaken', undefined)
  }

  onSeasonChange(season: string) {
    console.log(`🌍 Emitting season change: ${season}`)
    audioBus.emit(`season.enter.${season}` as any, undefined)
    fxBus.emit(`season.enter.${season}` as any, undefined)
  }

  onGameEnd(ending: string) {
    console.log(`🏁 Emitting game end: ${ending}`)
    audioBus.emit(`ending.${ending}` as any, undefined)
    fxBus.emit(`ending.${ending}` as any, undefined)
  }
}

export const entropyBindings = new EntropyBindings()
