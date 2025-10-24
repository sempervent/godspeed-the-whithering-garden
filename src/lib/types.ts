export type Domain = "FLESH" | "STONE" | "ASH" | "DREAM"
export type SaveSlot = "A" | "B" | "C"
export type EntropyTier = "Dormant" | "Breath" | "Pulse" | "Fever" | "Famine" | "Seizure"
export type Boon = "Harvest" | "Stillness" | "Veil" | "Echo" | "GraveMercy"
export type Price = "TithedBreath" | "StoneDue" | "AshTax" | "DreamDebt" | "GnawMemory"
export type SeedState = "PLANTED" | "GROWING" | "MATURE" | "STARVED" | "AWAKENED"
export type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER"

export interface Seed {
  id: string
  x: number
  y: number
  bornAt: number
  state: SeedState
  food: number
  maturity: number
  domainHint?: Domain
  lastFedAt?: number
  starveRisk: number
}

export interface God {
  id: string
  x: number
  y: number
  domain: Domain
  bornFromSeedId: string
  favor: Boon
  price: Price
  cooldownUntil: number
}

export interface GameStats {
  awakened: number
  starved: number
  harvested: number
  omenCount: number
  choicesMade: number
  falseChoicesTaken: number
}

export interface GameEnding {
  type: "AscendantChorus" | "GardenFamine" | "StoneSleep"
  score: number
  timestamp: number
}

// Legacy types for backward compatibility
export interface SeedNode {
  id: string
  x: number
  y: number
  bornAt: number
  viableMs: number
  expired: boolean
  rotUntil?: number
}

export interface GodNode {
  id: string
  x: number
  y: number
  domain: Domain
  cooldownUntil: number
}

export interface ActiveBoon {
  boon: Boon
  until: number
}

export interface ActivePrice {
  price: Price
  until: number
}

export interface FocusPoint {
  id: string
  x: number
  y: number
  kind: "seed" | "god"
  domain?: Domain
  bornAt: number
  ttlMs: number
}

export interface Mood {
  flesh: number
  stone: number
  ash: number
  dream: number
}

export interface SurfaceState {
  lastClick: { x: number; y: number } | null
  width: number
  height: number
}

export interface StoryLine {
  id: number
  text: string
  flags?: {
    seed?: boolean
    awaken?: boolean
    branch?: Domain
  }
  choices?: Array<{
    label: string
    domain: Domain
    goto: number
  }>
  goto?: number
}

export interface Story {
  lines: StoryLine[]
  title: string
  author: string
}

export interface HistoryEntry {
  id: number
  text: string
  flags?: {
    seed?: boolean
    awaken?: boolean
    branch?: Domain
  }
  ts: number
}

export interface GameState {
  lineIndex: number
  history: HistoryEntry[]
  seeds: number
  awakened: number
  entropy: number
  entropyRaw: number
  domainAlignments: Record<Domain, number>
  dominantGod?: Domain | null
  saveSlot: SaveSlot
  isPlaying: boolean
  focus: FocusPoint[]
  mood: Mood
  surface: SurfaceState
  seedsAlive: Record<string, SeedNode>
  godsAlive: Record<string, GodNode>
  activeBoons: ActiveBoon[]
  activePrices: ActivePrice[]
  domainBias?: Domain | null
  lastInteractionTime: number
  omenCooldownUntil: number
  // New persistent ecology
  persistentSeeds: Record<string, Seed>
  persistentGods: Record<string, God>
  season: Season
  seasonUntil: number
  seasonCount: number
  stats: GameStats
  runOver?: boolean
  score?: number
  ending?: GameEnding
  lastScoreboard: Array<{score: number, timestamp: number}>
}

export interface SaveData {
  lineIndex: number
  history: HistoryEntry[]
  seeds: number
  awakened: number
  entropy: number
  entropyRaw: number
  domainAlignments: Record<Domain, number>
  dominantGod?: Domain | null
  saveSlot: SaveSlot
  activeBoons: ActiveBoon[]
  activePrices: ActivePrice[]
  domainBias?: Domain | null
  timestamp: number
  // New persistent ecology
  persistentSeeds: Record<string, Seed>
  persistentGods: Record<string, God>
  season: Season
  seasonUntil: number
  seasonCount: number
  stats: GameStats
  runOver?: boolean
  score?: number
  ending?: GameEnding
  lastScoreboard: Array<{score: number, timestamp: number}>
}

export interface StoryEngine {
  loadStory(): Promise<Story>
  loadCorruption(): Promise<string[]>
  nextLine(state: GameState): StoryLine
  applyEntropy(text: string, entropy: number): string
  determineDominantGod(alignments: Record<Domain, number>): Domain | null
}
