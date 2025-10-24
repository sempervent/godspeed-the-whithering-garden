import { fxBus } from './fxBus'
import { userSettings } from '../settings/userSettings'

class FXEngine {
  private activeEffects = new Set<string>()

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Entropy effects
    fxBus.on('entropy.enter.40', () => this.addEffect('fx--shimmer'))
    fxBus.on('entropy.enter.60', () => this.addEffect('fx--flicker'))
    fxBus.on('entropy.enter.80', () => this.intensifyFlicker())
    fxBus.on('entropy.enter.90', () => this.addEffect('fx--intense-flicker'))
    fxBus.on('entropy.seizure', () => this.triggerSeizure())
    fxBus.on('ui.choice.open', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('corruption.inject', (payload) => this.handleCorruption(payload))

    fxBus.on('entropy.exit.40', () => this.removeEffect('fx--shimmer'))
    fxBus.on('entropy.exit.60', () => this.removeEffect('fx--flicker'))
    fxBus.on('entropy.exit.80', () => this.removeEffect('fx--intense-flicker'))
    fxBus.on('entropy.exit.90', () => this.removeEffect('fx--intense-flicker'))

    // New mechanics effects
    fxBus.on('seed.spawn', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('seed.expire', () => this.addEffect('fx--vignette'))
    fxBus.on('seed.click.viable', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('seed.click.rot', () => this.addEffect('fx--scanline'))
    
    fxBus.on('god.spawn', () => this.addEffect('fx--shimmer'))
    fxBus.on('god.bargain.open', () => this.addEffect('fx--bloom-pulse'))
    
    fxBus.on('god.boon.Harvest', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('god.boon.Stillness', () => this.addEffect('fx--vignette'))
    fxBus.on('god.boon.Veil', () => this.addEffect('fx--shimmer'))
    fxBus.on('god.boon.Echo', () => this.addEffect('fx--bloom-pulse'))
    
    fxBus.on('god.price.TithedBreath', () => this.addEffect('fx--scanline'))
    fxBus.on('god.price.StoneDue', () => this.addEffect('fx--flicker'))
    fxBus.on('god.price.AshTax', () => this.addEffect('fx--scanline'))
    fxBus.on('god.price.DreamDebt', () => this.addEffect('fx--shimmer'))
    
    fxBus.on('entropy.tier.enter.Pulse', () => this.addEffect('fx--shimmer'))
    fxBus.on('entropy.tier.enter.Fever', () => this.addEffect('fx--flicker'))
    fxBus.on('entropy.tier.enter.Famine', () => this.addEffect('fx--scanline'))
    fxBus.on('entropy.tier.enter.Seizure', () => this.triggerSeizure())
    
    fxBus.on('omen.trigger', () => this.triggerOmen())
    
    // Persistent ecology effects
    fxBus.on('seed.feed', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('seed.starve', () => this.addEffect('fx--vignette'))
    fxBus.on('seed.mature', () => this.addEffect('fx--shimmer'))
    fxBus.on('god.awaken', () => this.addEffect('fx--bloom-pulse'))
    
    fxBus.on('season.enter.SPRING', () => this.addEffect('fx--shimmer'))
    fxBus.on('season.enter.SUMMER', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('season.enter.AUTUMN', () => this.addEffect('fx--flicker'))
    fxBus.on('season.enter.WINTER', () => this.addEffect('fx--scanline'))
    
    fxBus.on('ending.AscendantChorus', () => this.addEffect('fx--bloom-pulse'))
    fxBus.on('ending.GardenFamine', () => this.addEffect('fx--vignette'))
    fxBus.on('ending.StoneSleep', () => this.addEffect('fx--shimmer'))
  }

  private addEffect(className: string) {
    if (userSettings.shouldReduceMotion()) return

    document.body.classList.add(className)
    this.activeEffects.add(className)
  }

  private removeEffect(className: string) {
    document.body.classList.remove(className)
    this.activeEffects.delete(className)
  }

  private intensifyFlicker() {
    if (userSettings.shouldReduceMotion()) return

    this.removeEffect('fx--flicker')
    this.addEffect('fx--intense-flicker')
  }

  private triggerSeizure() {
    if (userSettings.shouldReduceMotion()) return

    // Brief whiteout and scanline effect
    this.addEffect('fx--whiteout')
    this.addEffect('fx--scanline')

    // Remove after brief duration
    setTimeout(() => {
      this.removeEffect('fx--whiteout')
      this.removeEffect('fx--scanline')
    }, 500)
  }

  private handleCorruption(payload: { text: string; tags: string[] }) {
    // Add text rift effect to latest log entry
    const logEntries = document.querySelectorAll('[data-testid="log-entry"]')
    const latestEntry = logEntries[logEntries.length - 1]
    
    if (latestEntry) {
      latestEntry.classList.add('fx--text-rift')
      
      // Remove after animation
      setTimeout(() => {
        latestEntry.classList.remove('fx--text-rift')
      }, 2000)
    }
  }

  private triggerOmen() {
    // Omen event: screen whiteout + scanline
    this.addEffect('fx--whiteout')
    this.addEffect('fx--scanline')
    
    setTimeout(() => {
      this.removeEffect('fx--whiteout')
      this.removeEffect('fx--scanline')
    }, 3000)
  }

  // Public methods for manual control
  addEffect(className: string) {
    this.addEffect(className)
  }

  removeEffect(className: string) {
    this.removeEffect(className)
  }

  clearAllEffects() {
    this.activeEffects.forEach(effect => {
      document.body.classList.remove(effect)
    })
    this.activeEffects.clear()
  }
}

export const fxEngine = new FXEngine()
