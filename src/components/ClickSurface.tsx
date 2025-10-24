import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../lib/store'
import { useStory } from '../lib/storyEngine'
import { entropyBindings } from '../lib/entropyBindings'
import { SurfaceBackground } from './SurfaceBackground'
import { SurfaceLog } from './SurfaceLog'
import { FocusNodes } from './FocusNodes'
import { ChoiceChips } from './ChoiceChips'
import { SeedNodes } from './SeedNodes'
import { GodNodes } from './GodNodes'
import { PersistentSeedNodes } from './PersistentSeedNodes'
import { PersistentGodNodes } from './PersistentGodNodes'
import clsx from 'clsx'

interface ClickSurfaceProps {
  className?: string
}

export const ClickSurface = ({ className }: ClickSurfaceProps) => {
  const { 
    advanceStory, 
    tickEntropy, 
    addToHistory, 
    entropy,
    entropyRaw,
    entropyTier,
    applyChoice,
    incrementSeed,
    incrementAwakened,
    setLastClick,
    setSurfaceSize,
    spawnSeed,
    spawnGod,
    focus,
    lineIndex,
    seeds,
    awakened,
    domainAlignments,
    dominantGod,
    history,
    seedsAlive,
    godsAlive,
    activeBoons,
    activePrices,
    domainBias,
    spawnSeeds,
    tickSeeds,
    clickSeed,
    spawnGod: spawnGodNew,
    clickGod,
    modifyEntropy,
    decay,
    triggerOmen,
    // Persistent ecology actions
    spawnPersistentSeed,
    feedSeed,
    tickPersistentSeeds,
    attemptAwakening,
    tickSeasons,
    checkEndings,
    persistentSeeds,
    persistentGods,
    season,
    seasonCount,
    stats,
    runOver,
    score,
    ending
  } = useGameStore()
  const storyEngine = useStory()
  const lastClickTime = useRef<number>(0)
  const entropyDecayInterval = useRef<NodeJS.Timeout>()
  const [currentLine, setCurrentLine] = useState<any>(null)
  const [showChoices, setShowChoices] = useState(false)
  const [ripples, setRipples] = useState<Array<{id: string, x: number, y: number, size: number}>>([])
  const [storyLoaded, setStoryLoaded] = useState(false)
  const [currentStoryLine, setCurrentStoryLine] = useState<any>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)

  // Load story on mount
  useEffect(() => {
    const loadStory = async () => {
      try {
        await storyEngine.loadStory()
        setStoryLoaded(true)
        console.log('✅ Story loaded in ClickSurface')
        
        // Load initial story line
        const gameState = { lineIndex, entropy, history, seeds, awakened, domainAlignments, dominantGod, saveSlot: 'A' as const, isPlaying: true, focus, mood: { flesh: 0, stone: 0, ash: 0, dream: 0 }, surface: { lastClick: null, width: 0, height: 0 } }
        const initialStoryLine = storyEngine.nextLine(gameState)
        setCurrentStoryLine(initialStoryLine)
        console.log('📖 Initial story line loaded:', initialStoryLine.text.substring(0, 50) + '...')
      } catch (error) {
        console.error('❌ Failed to load story in ClickSurface:', error)
        setStoryLoaded(true) // Still set to true to show fallback
      }
    }
    loadStory()
  }, []) // Remove storyEngine dependency to prevent re-runs

  // Update current story line when lineIndex changes
  useEffect(() => {
    if (storyLoaded) {
      console.log('🔄 useEffect triggered - lineIndex:', lineIndex, 'storyLoaded:', storyLoaded)
      const gameState = { lineIndex, entropy, history, seeds, awakened, domainAlignments, dominantGod, saveSlot: 'A' as const, isPlaying: true, focus, mood: { flesh: 0, stone: 0, ash: 0, dream: 0 }, surface: { lastClick: null, width: 0, height: 0 } }
      const storyLine = storyEngine.nextLine(gameState)
      setCurrentStoryLine(storyLine)
      console.log('📖 Story line updated:', lineIndex, storyLine.text.substring(0, 50) + '...')
    }
  }, [lineIndex, storyLoaded]) // Only depend on lineIndex and storyLoaded

  // Set surface size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (surfaceRef.current) {
        const rect = surfaceRef.current.getBoundingClientRect()
        setSurfaceSize(rect.width, rect.height)
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [setSurfaceSize])

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const now = Date.now()
    
    setLastClick(x, y)
    
    // Create ripple effect
    const rippleId = `ripple-${Date.now()}`
    setRipples(prev => [...prev, { id: rippleId, x, y, size: 0 }])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId))
    }, 1000)
    
    // Check for burst clicking
    const timeSinceLastClick = now - lastClickTime.current
    lastClickTime.current = now
    
    if (timeSinceLastClick < 200) {
      // Fast click burst
      modifyEntropy(0.25, 'fast-click')
      entropyBindings.onEntropyTick('fast')
    } else {
      // Normal click
      modifyEntropy(0.08, 'advance-line')
    }
    
    // Update mood from current story line
    if (currentStoryLine) {
      console.log('🎯 Clicking with current story line:', currentStoryLine.text.substring(0, 50) + '...')
      useGameStore.getState().updateMoodFromText(currentStoryLine.text)
      
      // Add current line to history before advancing
      addToHistory(currentStoryLine)
      console.log('📝 Added to history, total entries:', history.length + 1)
      
          // Handle flags with new mechanics
          if (currentStoryLine.flags?.seed) {
            incrementSeed()
            // Spawn 1-3 persistent seeds based on entropy tier
            const tier = entropyTier()
            const seedCount = tier === 'Pulse' ? 3 : tier === 'Fever' ? 2 : 1
            for (let i = 0; i < seedCount; i++) {
              const seedX = x + (Math.random() - 0.5) * 100
              const seedY = y + (Math.random() - 0.5) * 100
              spawnPersistentSeed(seedX, seedY)
            }
            entropyBindings.onSeedFlag()
            console.log('🌱 Seed flag triggered, spawned', seedCount, 'persistent seeds')
          }
      
      if (currentStoryLine.flags?.awaken) {
        incrementAwakened()
        // Spawn god with domain bias
        const domain = domainBias || ['FLESH', 'STONE', 'ASH', 'DREAM'][Math.floor(Math.random() * 4)] as any
        spawnGodNew(domain, { x, y }, now)
        entropyBindings.onAwakenFlag()
        console.log('👁️ Awaken flag triggered, spawned', domain, 'god')
      }
      
      // Handle choices
      if (currentStoryLine.choices && currentStoryLine.choices.length > 0) {
        setCurrentLine(currentStoryLine)
        setShowChoices(true)
        entropyBindings.onChoiceOpen()
        console.log('🎯 Choices triggered')
      }
    }
    
    // Advance story (this will trigger the useEffect to update currentStoryLine)
    console.log('⏭️ Advancing story from lineIndex:', lineIndex, 'to:', lineIndex + 1)
    advanceStory()
  }

  const handleChoice = (domain: string, goto: number) => {
    applyChoice(domain as any)
    addToHistory({ id: -1, text: `Chose ${domain}`, timestamp: Date.now(), flags: { branch: domain } })
    setShowChoices(false)
    setCurrentLine(null)
  }

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!showChoices) {
          // Simulate click at center
          const centerX = surfaceRef.current?.clientWidth || 0 / 2
          const centerY = surfaceRef.current?.clientHeight || 0 / 2
          handleClick({ clientX: centerX, clientY: centerY } as any)
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showChoices])

  // Entropy decay
  useEffect(() => {
    entropyDecayInterval.current = setInterval(() => {
      const currentEntropy = useGameStore.getState().getEntropy()
      if (currentEntropy > 0) {
        tickEntropy(-0.1)
      }
    }, 1000)
    
    return () => {
      if (entropyDecayInterval.current) {
        clearInterval(entropyDecayInterval.current)
      }
    }
  }, [tickEntropy])

  // Ripple animation
  useEffect(() => {
    if (ripples.length === 0) return
    
    const interval = setInterval(() => {
      setRipples(prev => prev.map(ripple => ({
        ...ripple,
        size: Math.min(ripple.size + 2, 100)
      })))
    }, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [ripples.length]) // Only depend on ripples.length, not ripples array

      // Frame loop for persistent ecology
      useEffect(() => {
        let animationFrame: number
        let lastTime = Date.now()

        const frameLoop = (currentTime: number) => {
          const dt = (currentTime - lastTime) / 1000 // Convert to seconds
          lastTime = currentTime

          // Tick persistent seeds (growth, starvation, etc.)
          tickPersistentSeeds(dt, currentTime)

          // Attempt awakening every 1.2 seconds
          if (Math.floor(currentTime / 1200) !== Math.floor((currentTime - dt * 1000) / 1200)) {
            attemptAwakening(currentTime)
          }

          // Tick seasons
          tickSeasons(currentTime)

          // Check for endings
          checkEndings(currentTime)

          // Legacy mechanics
          tickSeeds(currentTime)
          decay(currentTime)

          // Check for omen events at high entropy
          const currentEntropy = useGameStore.getState().getEntropy()
          if (currentEntropy >= 90) {
            triggerOmen()
          }

          animationFrame = requestAnimationFrame(frameLoop)
        }

        animationFrame = requestAnimationFrame(frameLoop)

        return () => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame)
          }
        }
      }, [tickPersistentSeeds, attemptAwakening, tickSeasons, checkEndings, tickSeeds, decay, triggerOmen])

  return (
    <div ref={surfaceRef} className={clsx("relative overflow-hidden", className)} onClick={!showChoices ? handleClick : undefined}>
      <SurfaceBackground />
      <SeedNodes />
      <GodNodes />
      <FocusNodes />
      <PersistentSeedNodes />
      <PersistentGodNodes />
      <SurfaceLog />

      {/* Main content area */}
      {!showChoices && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 max-w-2xl">
            {!storyLoaded ? (
              <div className="mb-8">
                <p className="text-2xl text-gray-300 font-mono leading-relaxed mb-4">
                  Loading the garden...
                </p>
                <p className="text-sm text-gray-500 font-mono">
                  Please wait while the story loads
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-2xl text-gray-300 font-mono leading-relaxed mb-4">
                  {currentStoryLine?.text || 'Loading...'}
                </p>
                
                {/* Game State Visualizations */}
                <div className="mt-6 space-y-4">
                  <div className="text-sm text-gray-400 font-mono">
                    Line: {lineIndex} | Seeds: {seeds} | Awakened: {awakened} | Entropy: {useGameStore.getState().getEntropy().toFixed(2)}%
                  </div>
                  
                  {useGameStore.getState().getEntropy() > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${useGameStore.getState().getEntropy()}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Click indicator */}
            <div className={clsx(
              'text-6xl mb-4 transition-all duration-500',
              useGameStore.getState().getEntropy() > 60 ? 'animate-glitch text-red-400' : 'text-gray-300',
              'font-mono'
            )}>
              {useGameStore.getState().getEntropy() > 60 ? '◊' : '●'}
            </div>
            <p className="text-gray-400 text-lg font-mono">
              {useGameStore.getState().getEntropy() > 60 ? 'The garden trembles...' : 'Click to advance'}
            </p>
            <p className="text-gray-500 text-sm mt-2 font-mono">
              Space or Enter to advance
            </p>
          </div>
        </div>
      )}

      {/* Choice chips */}
      {showChoices && currentLine?.choices && (
        <ChoiceChips 
          choices={currentLine.choices}
          onSelect={handleChoice}
        />
      )}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none border-2 border-blue-400 rounded-full opacity-50 animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Entropy visual effect */}
      {useGameStore.getState().getEntropy() > 50 && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="w-full h-full opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,0,0,0.1) 0%, transparent 70%)`,
              animation: 'pulse 2s infinite'
            }}
          />
        </div>
      )}

      {/* Subtle pulse animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full opacity-5 bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse" />
      </div>
    </div>
  )
}