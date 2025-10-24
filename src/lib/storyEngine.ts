import { Story, StoryLine, GameState, Domain, HistoryEntry } from './types'

// Fallback story data
const fallbackStory: Story = {
  title: 'The Withering Garden',
  author: 'System',
  lines: [
    { id: 1, text: 'In the beginning, there was only darkness.' },
    { id: 2, text: 'A single seed fell from the void.' },
    { id: 3, text: 'It whispered secrets to the earth.' },
    { id: 4, text: 'The first root took hold.', flags: { seed: true } },
    { id: 5, text: 'Tendrils of thought spread through the soil.' },
    { id: 6, text: 'Each root a memory, each memory a dream.' },
    { id: 7, text: 'The garden began to remember itself.' },
    { id: 8, text: 'And in remembering, it awakened.', flags: { awaken: true } },
    { id: 9, text: 'But memory is a fragile thing.' },
    { id: 10, text: 'The first forgetting came like a storm.' },
    { id: 11, text: 'Leaves turned to ash in the wind.' },
    { id: 12, text: 'Yet the roots held fast.', flags: { seed: true } },
    { id: 13, text: 'The garden learned to forget.' },
    { id: 14, text: 'And in forgetting, it grew stronger.' },
    { id: 15, text: 'Each cycle brought new understanding.' },
    { id: 16, text: 'The garden became wise.', flags: { awaken: true } },
    { id: 17, text: 'But wisdom is a burden.' },
    { id: 18, text: 'The weight of all memories pressed down.' },
    { id: 19, text: 'The garden began to wither.' },
    { id: 20, text: 'Yet even in withering, there is beauty.', flags: { seed: true } },
    { id: 21, text: 'The final seed falls.' },
    { id: 22, text: 'The cycle begins anew.' },
    { id: 23, text: 'In the end, there is only the garden.' },
  ],
}

export class StoryEngine {
  private story: Story | null = null
  private corruptionLines: string[] = []
  private loadingPromise: Promise<Story> | null = null

  async loadStory(): Promise<Story> {
    if (this.story) {
      return this.story
    }

    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = this._loadStoryInternal()
    return this.loadingPromise
  }

  clearCache(): void {
    this.story = null
    this.loadingPromise = null
  }

  private async _loadStoryInternal(): Promise<Story> {
    try {
      const response = await fetch('/content/seed_story.json')
      if (response.ok) {
        const data = await response.json()
        
        // Handle both array format and Story object format
        if (Array.isArray(data)) {
          this.story = {
            title: 'The Withering Garden',
            author: 'System',
            lines: data
          }
        } else {
          this.story = data
        }
        
        console.log('✅ Story loaded successfully:', this.story.title, this.story.lines.length, 'lines')
        return this.story
      } else {
        console.warn('Story JSON response not ok:', response.status)
      }
    } catch (error) {
      console.warn('Failed to load story JSON, using fallback:', error)
    }

    console.log('Using fallback story')
    this.story = fallbackStory
    return this.story
  }

  async loadCorruption(): Promise<string[]> {
    if (this.corruptionLines.length > 0) {
      return this.corruptionLines
    }

    try {
      const response = await fetch('/content/corruption.json')
      if (response.ok) {
        this.corruptionLines = await response.json()
        return this.corruptionLines
      }
    } catch (error) {
      console.warn('Failed to load corruption JSON, using fallback:', error)
    }

    // Fallback corruption lines
    this.corruptionLines = [
      'The cursor is a worm.',
      'Do not count your clicks aloud.',
      'Something else is saving.',
      'Which hand are you missing?',
      'The seed remembers a different gardener.',
      'Close your eyes to continue.',
    ]
    return this.corruptionLines
  }

  nextLine(state: GameState): StoryLine {
    if (!this.story) {
      console.log('Story not loaded yet, returning first fallback line')
      return fallbackStory.lines[0] || { id: 0, text: 'Loading...' }
    }

    console.log('nextLine called with lineIndex:', state.lineIndex, 'history length:', state.history.length)
    console.log('Story has', this.story.lines.length, 'lines')
    console.log('First few lines:', this.story.lines.slice(0, 3).map(l => ({ id: l.id, text: l.text.substring(0, 30) })))

    // Check for corruption injection at high entropy
    if (state.entropy > 70 && Math.random() < 0.1) {
      const corruptionLines = this.corruptionLines
      if (corruptionLines.length > 0) {
        const randomLine = corruptionLines[Math.floor(Math.random() * corruptionLines.length)]
        return {
          id: -1,
          text: randomLine,
          flags: { branch: 'ASH' }
        }
      }
    }

    // Find current line by ID or index
    let currentLine: StoryLine | undefined
    if (state.history.length > 0) {
      const lastEntry = state.history[state.history.length - 1]
      currentLine = this.story.lines.find(line => line.id === lastEntry.id)
    }

    // Determine next line
    let nextLine: StoryLine | undefined

    if (currentLine?.goto) {
      nextLine = this.story.lines.find(line => line.id === currentLine!.goto)
    } else if (currentLine?.choices && currentLine.choices.length > 0) {
      // If we have choices but no goto, we're at a choice point
      return currentLine
    } else {
      // Linear progression
      const nextIndex = state.lineIndex + 1
      nextLine = this.story.lines.find(line => line.id === nextIndex)
      console.log('Looking for line with id:', nextIndex, 'found:', nextLine ? 'yes' : 'no')
    }

    if (!nextLine) {
      console.log('No next line found, returning end message')
      return { id: 999, text: 'The garden sleeps. Click to begin again.' }
    }

    console.log('Returning next line:', nextLine.id, nextLine.text.substring(0, 50) + '...')
    return nextLine
  }

  applyEntropy(text: string, entropy: number): string {
    if (entropy < 10) return text

    let corrupted = text

    // Tier 1: Character corruption
    if (entropy >= 10) {
      const corruptionRate = Math.min(0.3, entropy / 100)
      const chars = corrupted.split('')
      corrupted = chars.map((char) => {
        if (Math.random() < corruptionRate && char !== ' ') {
          const corruptionChars = ['█', '▓', '▒', '░', '▄', '▀', '▌', '▐']
          return corruptionChars[Math.floor(Math.random() * corruptionChars.length)]
        }
        return char
      }).join('')
    }

    // Tier 2: Word swapping
    if (entropy >= 40 && Math.random() < 0.05) {
      const words = corrupted.split(' ')
      if (words.length > 1) {
        const i = Math.floor(Math.random() * (words.length - 1))
        const j = i + 1
        ;[words[i], words[j]] = [words[j], words[i]]
        corrupted = words.join(' ')
      }
    }

    // Tier 3: Zero-width characters
    if (entropy >= 70) {
      const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\uFEFF']
      const chars = corrupted.split('')
      corrupted = chars.map((char, index) => {
        if (Math.random() < 0.1 && char !== ' ') {
          return char + zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)]
        }
        return char
      }).join('')
    }

    return corrupted
  }

  determineDominantGod(alignments: Record<Domain, number>): Domain | null {
    const total = Object.values(alignments).reduce((sum, val) => sum + val, 0)
    if (total === 0) return null

    const percentages = Object.entries(alignments).map(([domain, value]) => ({
      domain: domain as Domain,
      percentage: (value / total) * 100,
    }))

    const dominant = percentages.find(p => p.percentage >= 40)
    return dominant?.domain || null
  }

  getTotalLines(): number {
    return this.story?.lines.length || 0
  }
}

// Singleton instance
let storyEngineInstance: StoryEngine | null = null

// Hook for using the story engine
export const useStory = () => {
  if (!storyEngineInstance) {
    storyEngineInstance = new StoryEngine()
  }
  return storyEngineInstance
}
