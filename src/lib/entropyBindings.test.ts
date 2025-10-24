import { describe, it, expect, vi, beforeEach } from 'vitest'
import { entropyBindings } from './entropyBindings'
import { audioBus } from '../audio/audioBus'
import { fxBus } from '../fx/fxBus'

// Mock the event buses
vi.mock('../audio/audioBus', () => ({
  audioBus: {
    emit: vi.fn()
  }
}))

vi.mock('../fx/fxBus', () => ({
  fxBus: {
    emit: vi.fn()
  }
}))

describe('EntropyBindings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should emit entropy.enter.40 when crossing 40 threshold', () => {
    entropyBindings.updateEntropy(45)
    
    expect(audioBus.emit).toHaveBeenCalledWith('entropy.enter.40', undefined)
    expect(fxBus.emit).toHaveBeenCalledWith('entropy.enter.40', undefined)
  })

  it('should emit entropy.enter.60 when crossing 60 threshold', () => {
    entropyBindings.updateEntropy(65)
    
    expect(audioBus.emit).toHaveBeenCalledWith('entropy.enter.60', undefined)
    expect(fxBus.emit).toHaveBeenCalledWith('entropy.enter.60', undefined)
  })

  it('should emit entropy.exit.60 when dropping below 60', () => {
    // First cross the threshold
    entropyBindings.updateEntropy(65)
    vi.clearAllMocks()
    
    // Then drop below
    entropyBindings.updateEntropy(55)
    
    expect(audioBus.emit).toHaveBeenCalledWith('entropy.exit.60', undefined)
    expect(fxBus.emit).toHaveBeenCalledWith('entropy.exit.60', undefined)
  })

  it('should emit entropy.seizure when reaching 90', () => {
    entropyBindings.updateEntropy(95)
    
    expect(audioBus.emit).toHaveBeenCalledWith('entropy.seizure', undefined)
    expect(fxBus.emit).toHaveBeenCalledWith('entropy.seizure', undefined)
  })

  it('should emit story events for flags', () => {
    entropyBindings.onSeedFlag()
    expect(audioBus.emit).toHaveBeenCalledWith('story.flags.seed', undefined)
    
    entropyBindings.onAwakenFlag()
    expect(audioBus.emit).toHaveBeenCalledWith('story.flags.awaken', undefined)
  })

  it('should emit choice events', () => {
    entropyBindings.onChoiceOpen()
    
    expect(audioBus.emit).toHaveBeenCalledWith('ui.choice.open', undefined)
    expect(fxBus.emit).toHaveBeenCalledWith('ui.choice.open', undefined)
  })

  it('should emit corruption events with tags', () => {
    const text = 'The cursor twitches [loud]'
    const tags = ['loud']
    
    entropyBindings.onCorruptionInject(text, tags)
    
    expect(audioBus.emit).toHaveBeenCalledWith('corruption.inject', { text, tags })
    expect(fxBus.emit).toHaveBeenCalledWith('corruption.inject', { text, tags })
    expect(audioBus.emit).toHaveBeenCalledWith('corruption.tag.loud', undefined)
  })
})
