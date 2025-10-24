import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState, Domain, SaveSlot, HistoryEntry, SaveData, FocusPoint, Mood, SurfaceState, SeedNode, GodNode, ActiveBoon, ActivePrice, EntropyTier, Boon, Price, Seed, God, GameStats, Season, SeedState, GameEnding } from './types'
import { entropyBindings } from './entropyBindings'

interface GameStore extends GameState {
  // Core actions
  advanceStory: () => void
  applyChoice: (domain: Domain) => void
  tickEntropy: (delta: number) => void
  addToHistory: (entry: HistoryEntry) => void
  
  // Domain actions
  incrementSeed: () => void
  incrementAwakened: () => void
  updateDomainAlignment: (domain: Domain, delta: number) => void
  
  // Surface actions
  spawnSeed: (x: number, y: number, ttlMs?: number) => void
  spawnGod: (x: number, y: number, domain?: Domain, ttlMs?: number) => void
  despawnFocus: (id: string) => void
  updateMoodFromText: (line: string) => void
  setSurfaceSize: (width: number, height: number) => void
  setLastClick: (x: number, y: number) => void
  restartConfirm: () => void
  
  // New mechanics actions
  spawnSeeds: (n: number, at: { x: number; y: number } | null) => void
  tickSeeds: (now: number) => void
  clickSeed: (id: string, now: number) => void
  spawnGod: (domain: Domain, at: { x: number; y: number }, now: number) => void
  clickGod: (id: string, now: number) => void
  applyBoon: (boon: Boon, until: number) => void
  applyPrice: (price: Price, until: number) => void
  modifyEntropy: (delta: number, source?: string) => void
  setDomainBias: (domain?: Domain | null) => void
  decay: (now: number) => void

  // Persistent ecology actions
  spawnPersistentSeed: (x: number, y: number, domainHint?: Domain) => string
  feedSeed: (id: string, now: number) => void
  tickPersistentSeeds: (dt: number, now: number) => void
  attemptAwakening: (now: number) => void
  tickSeasons: (now: number) => void
  checkEndings: (now: number) => void
  calculateScore: () => number
  endRun: (ending: GameEnding) => void
  hardReset: () => void
  
  // Selectors
  getEntropy: () => number
  entropyTier: () => EntropyTier
  
  // Omen Events
  triggerOmen: () => boolean
  
  // Save/Load actions
  save: () => void
  load: (slot: SaveSlot) => void
  exportSave: () => string
  importSave: (json: string) => boolean
  resetRun: (preserveMeta?: boolean) => void
  
  // Utility
  determineDominantGod: () => void
}

const initialDomainAlignments: Record<Domain, number> = {
  FLESH: 0,
  STONE: 0,
  ASH: 0,
  DREAM: 0,
}

const initialMood: Mood = {
  flesh: 0,
  stone: 0,
  ash: 0,
  dream: 0,
}

const initialSurface: SurfaceState = {
  lastClick: null,
  width: 0,
  height: 0,
}

const initialStats: GameStats = {
  awakened: 0,
  starved: 0,
  harvested: 0,
  omenCount: 0,
  choicesMade: 0,
  falseChoicesTaken: 0,
}

const initialState: GameState = {
  lineIndex: 0,
  history: [],
  seeds: 0,
  awakened: 0,
  entropy: 0,
  entropyRaw: 0,
  domainAlignments: initialDomainAlignments,
  dominantGod: null,
  saveSlot: 'A',
  isPlaying: false,
  focus: [],
  mood: initialMood,
  surface: initialSurface,
  seedsAlive: {},
  godsAlive: {},
  activeBoons: [],
  activePrices: [],
  domainBias: null,
  lastInteractionTime: 0,
  omenCooldownUntil: 0,
  // New persistent ecology
  persistentSeeds: {},
  persistentGods: {},
  season: 'SPRING',
  seasonUntil: Date.now() + 45000, // 45 seconds
  seasonCount: 0,
  stats: initialStats,
  runOver: false,
  score: undefined,
  ending: undefined,
  lastScoreboard: [],
}

// Debounced save function
let saveTimeout: NodeJS.Timeout | null = null

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      advanceStory: () => {
        set((state) => ({
          lineIndex: state.lineIndex + 1,
          isPlaying: true,
        }))
        get().save()
      },

      applyChoice: (domain: Domain) => {
        const state = get()
        set({
          domainAlignments: {
            ...state.domainAlignments,
            [domain]: state.domainAlignments[domain] + 1,
          },
        })
        get().determineDominantGod()
        get().save()
      },

      tickEntropy: (delta: number) => {
        get().modifyEntropy(delta, 'manual-tick')
      },

      addToHistory: (entry: HistoryEntry) => {
        set((state) => ({
          history: [...state.history, entry],
        }))
        get().save()
      },

      incrementSeed: () => {
        set((state) => {
          const newSeeds = state.seeds + 1
          const newAwakened = Math.floor(newSeeds / 5) > Math.floor(state.seeds / 5) 
            ? state.awakened + 1 
            : state.awakened
          return {
            seeds: newSeeds,
            awakened: newAwakened,
          }
        })
        get().save()
      },

      incrementAwakened: () => {
        set((state) => ({
          awakened: state.awakened + 1,
        }))
        get().save()
      },

      updateDomainAlignment: (domain: Domain, delta: number) => {
        set((state) => ({
          domainAlignments: {
            ...state.domainAlignments,
            [domain]: Math.max(0, state.domainAlignments[domain] + delta),
          },
        }))
        get().determineDominantGod()
        get().save()
      },

      determineDominantGod: () => {
        const state = get()
        const total = Object.values(state.domainAlignments).reduce((sum, val) => sum + val, 0)
        if (total === 0) {
          set({ dominantGod: null })
          return
        }

        const percentages = Object.entries(state.domainAlignments).map(([domain, value]) => ({
          domain: domain as Domain,
          percentage: (value / total) * 100,
        }))

        const dominant = percentages.find(p => p.percentage >= 40)
        set({ dominantGod: dominant?.domain || null })
      },

      save: () => {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          const state = get()
          const saveData: SaveData = {
            lineIndex: state.lineIndex,
            history: state.history,
            seeds: state.seeds,
            awakened: state.awakened,
            entropy: state.entropy,
            domainAlignments: state.domainAlignments,
            dominantGod: state.dominantGod,
            saveSlot: state.saveSlot,
            timestamp: Date.now(),
          }
          localStorage.setItem(`godseed-save-${state.saveSlot}`, JSON.stringify(saveData))
        }, 100)
      },

      load: (slot: SaveSlot) => {
        const saved = localStorage.getItem(`godseed-save-${slot}`)
        if (saved) {
          try {
            const saveData: SaveData = JSON.parse(saved)
            set({
              lineIndex: saveData.lineIndex,
              history: saveData.history,
              seeds: saveData.seeds,
              awakened: saveData.awakened,
              entropy: saveData.entropy,
              domainAlignments: saveData.domainAlignments,
              dominantGod: saveData.dominantGod,
              saveSlot: slot,
              isPlaying: true,
            })
          } catch (error) {
            console.error('Failed to load save:', error)
          }
        }
      },

      exportSave: () => {
        const state = get()
        const saveData: SaveData = {
          lineIndex: state.lineIndex,
          history: state.history,
          seeds: state.seeds,
          awakened: state.awakened,
          entropy: state.entropy,
          domainAlignments: state.domainAlignments,
          dominantGod: state.dominantGod,
          saveSlot: state.saveSlot,
          timestamp: Date.now(),
        }
        return JSON.stringify(saveData, null, 2)
      },

      importSave: (json: string) => {
        try {
          const saveData: SaveData = JSON.parse(json)
          set({
            lineIndex: saveData.lineIndex,
            history: saveData.history,
            seeds: saveData.seeds,
            awakened: saveData.awakened,
            entropy: saveData.entropy,
            domainAlignments: saveData.domainAlignments,
            dominantGod: saveData.dominantGod,
            saveSlot: saveData.saveSlot,
            isPlaying: true,
          })
          return true
        } catch (error) {
          console.error('Failed to import save:', error)
          return false
        }
      },

      resetRun: (preserveMeta = false) => {
        if (preserveMeta) {
          set({
            lineIndex: 0,
            history: [],
            seeds: 0,
            awakened: 0,
            entropy: 0,
            isPlaying: false,
          })
        } else {
          set(initialState)
        }
        get().save()
      },

      // Surface actions
      spawnSeed: (x: number, y: number, ttlMs = 5000) => {
        const id = `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const focusPoint: FocusPoint = {
          id,
          x,
          y,
          kind: 'seed',
          bornAt: Date.now(),
          ttlMs,
        }
        set((state) => ({
          focus: [...state.focus, focusPoint],
        }))
        
        // Auto-remove after TTL
        setTimeout(() => {
          get().despawnFocus(id)
        }, ttlMs)
      },


      despawnFocus: (id: string) => {
        set((state) => ({
          focus: state.focus.filter(f => f.id !== id),
        }))
      },

      updateMoodFromText: (line: string) => {
        const words = line.toLowerCase().split(/\s+/)
        
        // Word maps for mood detection
        const fleshWords = ['blood', 'warm', 'mouth', 'vein', 'tooth', 'pulse', 'flesh', 'heart', 'breath']
        const stoneWords = ['weight', 'cliff', 'gravity', 'hinge', 'mountain', 'stone', 'rock', 'heavy', 'solid']
        const ashWords = ['ash', 'dust', 'silence', 'white', 'ember', 'cold', 'void', 'empty', 'fade']
        const dreamWords = ['dream', 'echo', 'sleep', 'mirror', 'name', 'memory', 'shadow', 'whisper', 'vision']
        
        const fleshCount = words.filter(w => fleshWords.includes(w)).length
        const stoneCount = words.filter(w => stoneWords.includes(w)).length
        const ashCount = words.filter(w => ashWords.includes(w)).length
        const dreamCount = words.filter(w => dreamWords.includes(w)).length
        
        set((state) => ({
          mood: {
            flesh: (state.mood.flesh * 0.95) + fleshCount,
            stone: (state.mood.stone * 0.95) + stoneCount,
            ash: (state.mood.ash * 0.95) + ashCount,
            dream: (state.mood.dream * 0.95) + dreamCount,
          },
        }))
      },

      setSurfaceSize: (width: number, height: number) => {
        set((state) => ({
          surface: {
            ...state.surface,
            width,
            height,
          },
        }))
      },

      setLastClick: (x: number, y: number) => {
        set((state) => ({
          surface: {
            ...state.surface,
            lastClick: { x, y },
          },
        }))
      },

      restartConfirm: () => {
        // This will be handled by the UI component
        // For now, just call resetRun directly
        get().resetRun(false)
      },

      // New mechanics actions
      spawnSeeds: (n: number, at: { x: number; y: number } | null) => {
        const now = Date.now()
        const surface = get().surface
        const centerX = at?.x || surface.width / 2
        const centerY = at?.y || surface.height / 2
        
        const newSeeds: Record<string, SeedNode> = {}
        
        for (let i = 0; i < n; i++) {
          const id = `seed-${now}-${i}`
          const viableMs = 2500 + Math.random() * 2500 - (get().entropy * 6)
          const clampedViableMs = Math.max(1200, viableMs)
          
          // Random position within bounds, avoiding edges by 32px
          const x = Math.max(32, Math.min(surface.width - 32, centerX + (Math.random() - 0.5) * 200))
          const y = Math.max(32, Math.min(surface.height - 32, centerY + (Math.random() - 0.5) * 200))
          
          newSeeds[id] = {
            id,
            x,
            y,
            bornAt: now,
            viableMs: clampedViableMs,
            expired: false
          }
        }
        
        set((state) => ({
          seedsAlive: { ...state.seedsAlive, ...newSeeds }
        }))
      },

      tickSeeds: (now: number) => {
        set((state) => {
          const updatedSeeds = { ...state.seedsAlive }
          let entropyDelta = 0
          
              Object.values(updatedSeeds).forEach(seed => {
                if (!seed.expired && now - seed.bornAt >= seed.viableMs) {
                  // Seed expired, become rot
                  updatedSeeds[seed.id] = {
                    ...seed,
                    expired: true,
                    rotUntil: now + 4000 // 4 seconds of rot
                  }
                  // Emit seed expire event
                  entropyBindings.onSeedExpire()
                } else if (seed.expired && seed.rotUntil && now >= seed.rotUntil) {
              // Rot expired, remove seed
              delete updatedSeeds[seed.id]
            } else if (seed.expired && seed.rotUntil) {
              // Rot bleeding entropy
              entropyDelta += 0.02 * (1/60) // Assuming 60fps
            }
          })
          
          if (entropyDelta > 0) {
            get().modifyEntropy(entropyDelta, 'rot-bleed')
          }
          
          return { seedsAlive: updatedSeeds }
        })
      },

      clickSeed: (id: string, now: number) => {
        const seed = get().seedsAlive[id]
        if (!seed) return
        
        if (!seed.expired) {
          // Viable seed click
          set((state) => {
            const newSeeds = { ...state.seedsAlive }
            delete newSeeds[id]
            return { seedsAlive: newSeeds }
          })
          
          get().incrementSeed()
          get().modifyEntropy(-0.07, 'viable-seed')

          // Emit events
          entropyBindings.onSeedFlag()
          entropyBindings.onSeedSpawn()
          entropyBindings.onSeedClickViable()
          
          // Add micro-lore line
          const microLore = [
            "root drinks deeper",
            "the soil remembers",
            "tendrils spread",
            "earth whispers back"
          ]
          const randomLore = microLore[Math.floor(Math.random() * microLore.length)]
          get().addToHistory({
            id: -1,
            text: randomLore,
            ts: now
          })
        } else {
          // Rot seed click
          set((state) => {
            const newSeeds = { ...state.seedsAlive }
            delete newSeeds[id]
            return { seedsAlive: newSeeds }
          })
          
          get().modifyEntropy(0.12, 'rot-seed')

          // Emit events
          entropyBindings.onSeedClickRot()

          // Inject corruption line
          const corruptionLines = [
            "the rot spreads",
            "decay takes hold",
            "something festers",
            "the garden sickens"
          ]
          const randomCorruption = corruptionLines[Math.floor(Math.random() * corruptionLines.length)]
          get().addToHistory({
            id: -1,
            text: randomCorruption,
            ts: now
          })
        }
      },

      spawnGod: (domain: Domain, at: { x: number; y: number }, now: number) => {
        const id = `god-${now}`
        const jitterX = at.x + (Math.random() - 0.5) * 96 // ±48px
        const jitterY = at.y + (Math.random() - 0.5) * 96
        
        set((state) => ({
          godsAlive: {
            ...state.godsAlive,
            [id]: {
              id,
              x: jitterX,
              y: jitterY,
              domain,
              cooldownUntil: 0
            }
          }
        }))
      },

      clickGod: (id: string, now: number) => {
        const god = get().godsAlive[id]
        if (!god || now < god.cooldownUntil) return
        
        // Set cooldown
        set((state) => ({
          godsAlive: {
            ...state.godsAlive,
            [id]: {
              ...god,
              cooldownUntil: now + 12000 // 12 second cooldown
            }
          }
        }))
        
          // Emit events
          entropyBindings.onAwakenFlag()
          entropyBindings.onGodSpawn()
      },

      applyBoon: (boon: Boon, until: number) => {
        set((state) => ({
          activeBoons: [...state.activeBoons, { boon, until }]
        }))
        entropyBindings.onBoonApplied(boon)
      },

      applyPrice: (price: Price, until: number) => {
        set((state) => ({
          activePrices: [...state.activePrices, { price, until }]
        }))
        entropyBindings.onPriceApplied(price)
      },

      modifyEntropy: (delta: number, source?: string) => {
        set((state) => {
          const oldEntropy = state.entropy
          const newEntropyRaw = Math.max(0, state.entropyRaw + delta)
          const newEntropy = Math.min(100, Math.max(0, Number(newEntropyRaw.toFixed(2))))

          // Check for tier changes
          const oldTier = state.entropy < 10 ? 'Dormant' : 
                         state.entropy < 25 ? 'Breath' : 
                         state.entropy < 50 ? 'Pulse' : 
                         state.entropy < 75 ? 'Fever' : 
                         state.entropy < 90 ? 'Famine' : 'Seizure'
          
          const newTier = newEntropy < 10 ? 'Dormant' : 
                         newEntropy < 25 ? 'Breath' : 
                         newEntropy < 50 ? 'Pulse' : 
                         newEntropy < 75 ? 'Fever' : 
                         newEntropy < 90 ? 'Famine' : 'Seizure'
          
          if (oldTier !== newTier) {
            entropyBindings.onEntropyTierExit(oldTier)
            entropyBindings.onEntropyTierEnter(newTier)
          }

          // Notify entropy bindings of the change
          entropyBindings.updateEntropy(newEntropy)

          return {
            entropyRaw: newEntropyRaw,
            entropy: newEntropy,
            lastInteractionTime: Date.now()
          }
        })
        get().save()
      },

      setDomainBias: (domain?: Domain | null) => {
        set({ domainBias: domain })
      },

      decay: (now: number) => {
        const state = get()
        const timeSinceInteraction = now - state.lastInteractionTime

        if (timeSinceInteraction > 3000) { // 3 seconds of inactivity (increased from 2)
          const decayMultiplier = state.activeBoons.some(b => b.boon === 'Stillness' && b.until > now) ? 1.6 :
                                 state.activePrices.some(p => p.price === 'TithedBreath' && p.until > now) ? 0.7 : 1.0

          const decayDelta = -0.01 * (1/60) * decayMultiplier // Reduced from 0.02 to 0.01
          if (decayDelta < 0) {
            get().modifyEntropy(decayDelta, 'idle-decay')
          }
        }
        
        // Clean up expired boons and prices
        set((state) => ({
          activeBoons: state.activeBoons.filter(b => b.until > now),
          activePrices: state.activePrices.filter(p => p.until > now)
        }))
      },

      // Selectors
      getEntropy: () => {
        const state = get()
        return Math.min(100, Math.max(0, Number(state.entropyRaw.toFixed(2))))
      },

      entropyTier: () => {
        const entropy = get().getEntropy()
        if (entropy < 10) return 'Dormant'
        if (entropy < 25) return 'Breath'
        if (entropy < 50) return 'Pulse'
        if (entropy < 75) return 'Fever'
        if (entropy < 90) return 'Famine'
        return 'Seizure'
      },

      // Omen Events
      triggerOmen: () => {
        const state = get()
        const now = Date.now()
        
        // Check if omen is on cooldown
        if (now < state.omenCooldownUntil) return false
        
        // Trigger omen event
        set({ omenCooldownUntil: now + 10000 }) // 10 second cooldown
        
        // Emit omen events
        entropyBindings.onOmenTrigger()
        
        // Add omen line to history
        const omenLines = [
          "The garden shudders with ancient knowledge",
          "Something vast stirs beneath the soil",
          "The air itself trembles with forgotten power",
          "A presence older than memory awakens"
        ]
        const randomOmen = omenLines[Math.floor(Math.random() * omenLines.length)]
        get().addToHistory({
          id: -1,
          text: randomOmen,
          ts: now
        })
        
        // Reduce entropy after omen
        get().modifyEntropy(-0.8, 'omen-release')
        
        return true
      },

      // Persistent ecology actions
      spawnPersistentSeed: (x: number, y: number, domainHint?: Domain) => {
        const id = `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const seed: Seed = {
          id,
          x,
          y,
          bornAt: Date.now(),
          state: 'PLANTED',
          food: 0.35,
          maturity: 0,
          domainHint,
          starveRisk: 0.10 + Math.random() * 0.12, // 0.10 to 0.22
        }
        
        set((state) => ({
          persistentSeeds: { ...state.persistentSeeds, [id]: seed }
        }))
        
        entropyBindings.onSeedSpawn()
        return id
      },

      feedSeed: (id: string, now: number) => {
        set((state) => {
          const seed = state.persistentSeeds[id]
          if (!seed || seed.state === 'STARVED' || seed.state === 'AWAKENED') return state
          
          const updatedSeed = {
            ...seed,
            food: Math.min(1, seed.food + 0.25),
            lastFedAt: now,
            state: seed.state === 'PLANTED' ? 'GROWING' : seed.state
          }
          
          return {
            persistentSeeds: { ...state.persistentSeeds, [id]: updatedSeed },
            stats: {
              ...state.stats,
              harvested: state.stats.harvested + 1
            }
          }
        })
        
        get().modifyEntropy(-0.03, 'seed-feed')
        entropyBindings.onSeedClickViable()
        entropyBindings.onSeedFeed()
      },

      tickPersistentSeeds: (dt: number, now: number) => {
        set((state) => {
          const updatedSeeds = { ...state.persistentSeeds }
          const season = state.season
          const entropy = state.entropy
          
          // Season multipliers
          const seasonMults = {
            SPRING: 0.8,
            SUMMER: 1.0,
            AUTUMN: 1.2,
            WINTER: 1.35
          }
          
          const seasonMult = seasonMults[season]
          const entropyMult = 1 + (entropy / 100) * 0.8
          const baseDecay = 0.02
          const foodDecayRate = baseDecay * seasonMult * entropyMult
          
          // Growth rate
          const growthRate = 0.015
          
          Object.values(updatedSeeds).forEach(seed => {
            if (seed.state === 'STARVED' || seed.state === 'AWAKENED') return
            
            // Food decay
            const newFood = Math.max(0, seed.food - foodDecayRate * dt)
            
            // Maturity growth
            const fedBonus = seed.lastFedAt && (now - seed.lastFedAt) < 2500 ? 0.4 : 0
            const choiceAura = 1 + (state.domainBias ? 0.35 : 0) // Domain bias boost
            const maturityDelta = growthRate * (1 + fedBonus) * choiceAura * dt
            
            const updatedSeed = {
              ...seed,
              food: newFood,
              maturity: Math.min(1, seed.maturity + maturityDelta)
            }
            
            // State transitions
            if (updatedSeed.maturity >= 1.0 && updatedSeed.state !== 'MATURE') {
              updatedSeed.state = 'MATURE'
              entropyBindings.onSeedMature()
            }
            
            // Starvation check
            if (updatedSeed.food <= 0.05 && updatedSeed.state !== 'STARVED') {
              const starveProb = Math.max(0.02, Math.min(0.7,
                updatedSeed.starveRisk +
                0.15 * (entropy / 100) +
                (season === 'SPRING' ? -0.03 : season === 'SUMMER' ? 0.02 : season === 'AUTUMN' ? 0.05 : 0.08) -
                0.05 * (state.activeBoons.some(b => b.boon === 'Veil' || b.boon === 'Stillness') ? 1 : 0)
              ))
              
              if (Math.random() < starveProb) {
                updatedSeed.state = 'STARVED'
                entropyBindings.onSeedExpire()
                entropyBindings.onSeedStarve()
                get().modifyEntropy(0.12, 'seed-starve')
                
                // Remove after 4 seconds
                setTimeout(() => {
                  set((state) => {
                    const newSeeds = { ...state.persistentSeeds }
                    delete newSeeds[seed.id]
                    return { persistentSeeds: newSeeds }
                  })
                }, 4000)
              }
            }
            
            updatedSeeds[seed.id] = updatedSeed
          })
          
          return { persistentSeeds: updatedSeeds }
        })
      },

      attemptAwakening: (now: number) => {
        set((state) => {
          const matureSeeds = Object.values(state.persistentSeeds).filter(s => s.state === 'MATURE')
          if (matureSeeds.length === 0) return state
          
          const seed = matureSeeds[Math.floor(Math.random() * matureSeeds.length)]
          const entropy = state.entropy
          
          // Awakening probability
          let pAwaken = 0.25
          pAwaken += 0.10 * (state.domainBias ? 1 : 0) // Recent domain clicks
          pAwaken += 0.12 * 0.5 // Domain mood affinity (simplified)
          pAwaken -= 0.15 * (entropy >= 70 ? 1 : 0) // Entropy blocker
          pAwaken += state.activeBoons.some(b => b.boon === 'Harvest') ? 0.08 : 0
          pAwaken += state.activeBoons.some(b => b.boon === 'Echo') ? 0.05 : 0
          
          const clampedP = Math.max(0.02, Math.min(0.85, pAwaken))
          
          if (Math.random() < clampedP) {
            // Transform seed to god
            const domain = seed.domainHint || (['FLESH', 'STONE', 'ASH', 'DREAM'][Math.floor(Math.random() * 4)] as Domain)
            const favors: Boon[] = ['Harvest', 'Stillness', 'Veil', 'Echo', 'GraveMercy']
            const prices: Price[] = ['TithedBreath', 'StoneDue', 'AshTax', 'DreamDebt', 'GnawMemory']
            
            const god: God = {
              id: `god-${now}`,
              x: seed.x,
              y: seed.y,
              domain,
              bornFromSeedId: seed.id,
              favor: favors[Math.floor(Math.random() * favors.length)],
              price: prices[Math.floor(Math.random() * prices.length)],
              cooldownUntil: now + 8000
            }
            
            // Remove seed, add god
            const newSeeds = { ...state.persistentSeeds }
            delete newSeeds[seed.id]
            
            return {
              persistentSeeds: newSeeds,
              persistentGods: { ...state.persistentGods, [god.id]: god },
              stats: { ...state.stats, awakened: state.stats.awakened + 1 }
            }
          }
          
          return state
        })
        
        get().modifyEntropy(-0.05, 'god-awaken')
        entropyBindings.onGodSpawn()
        entropyBindings.onGodAwaken()
      },

      tickSeasons: (now: number) => {
        set((state) => {
          if (now >= state.seasonUntil) {
            const seasons: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
            const currentIndex = seasons.indexOf(state.season)
            const nextIndex = (currentIndex + 1) % seasons.length
            const nextSeason = seasons[nextIndex]
            
            // If we're cycling back to SPRING, increment season count
            const newSeasonCount = nextIndex === 0 ? state.seasonCount + 1 : state.seasonCount
            
            entropyBindings.onSeasonChange(nextSeason)
            
            return {
              season: nextSeason,
              seasonUntil: now + 45000 + Math.random() * 25000, // 45-70 seconds
              seasonCount: newSeasonCount
            }
          }
          return state
        })
      },

      checkEndings: (now: number) => {
        const state = get()
        const { stats, persistentSeeds, persistentGods, entropy, seasonCount } = state
        
        // Ascendant Chorus: 15+ gods, low entropy, multiple seasons
        if (stats.awakened >= 15 && entropy < 15 && seasonCount >= 3) {
          get().endRun({
            type: 'AscendantChorus',
            score: get().calculateScore(),
            timestamp: now
          })
          return
        }
        
        // Garden Famine: 50+ starvations in one season or very high entropy for extended time
        if (stats.starved >= 50 || (entropy >= 95 && seasonCount >= 2)) {
          get().endRun({
            type: 'GardenFamine',
            score: get().calculateScore(),
            timestamp: now
          })
          return
        }
        
        // Stone Sleep: no seeds or gods for 30 seconds (increased from 20)
        const seedCount = Object.keys(persistentSeeds).length
        const godCount = Object.keys(persistentGods).length
        if (seedCount === 0 && godCount === 0) {
          // Start timer if not already started
          if (!state.runOver) {
            setTimeout(() => {
              const currentState = get()
              if (Object.keys(currentState.persistentSeeds).length === 0 && 
                  Object.keys(currentState.persistentGods).length === 0) {
                get().endRun({
                  type: 'StoneSleep',
                  score: get().calculateScore(),
                  timestamp: Date.now()
                })
              }
            }, 30000) // Increased from 20000
          }
        }
      },

      calculateScore: () => {
        const state = get()
        const { stats, entropy, seasonCount } = state
        
        const baseScore = 100 * stats.awakened + 25 * seasonCount + 8 * stats.harvested
        const penalty = 5 * stats.starved + 2 * stats.falseChoicesTaken
        
        const entropyDisciplineBonus = Math.max(0, 120 - 4 * entropy)
        const omenMastery = 60 - 10 * Math.min(6, stats.omenCount)
        
        return Math.max(0, baseScore - penalty + entropyDisciplineBonus + omenMastery)
      },

      endRun: (ending: GameEnding) => {
        const score = get().calculateScore()
        const scoreboard = get().lastScoreboard
        
        set((state) => ({
          runOver: true,
          score,
          ending,
          lastScoreboard: [...scoreboard, { score, timestamp: Date.now() }].slice(-5)
        }))
        
        entropyBindings.onOmenTrigger()
        entropyBindings.onGameEnd(ending.type)
      },

      hardReset: () => {
        set(initialState)
        get().save()
      },
    }),
    {
      name: 'godseed-storage',
      partialize: (state) => ({
        lineIndex: state.lineIndex,
        history: state.history,
        seeds: state.seeds,
        awakened: state.awakened,
        entropy: state.entropy,
        entropyRaw: state.entropyRaw,
        domainAlignments: state.domainAlignments,
        dominantGod: state.dominantGod,
        saveSlot: state.saveSlot,
        activeBoons: state.activeBoons,
        activePrices: state.activePrices,
        domainBias: state.domainBias,
        // New persistent ecology
        persistentSeeds: state.persistentSeeds,
        persistentGods: state.persistentGods,
        season: state.season,
        seasonUntil: state.seasonUntil,
        seasonCount: state.seasonCount,
        stats: state.stats,
        runOver: state.runOver,
        score: state.score,
        ending: state.ending,
        lastScoreboard: state.lastScoreboard,
      }),
    }
  )
)
