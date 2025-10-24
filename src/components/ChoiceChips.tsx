import { useGameStore } from '../lib/store'
import { Domain } from '../lib/types'
import { entropyBindings } from '../lib/entropyBindings'
import clsx from 'clsx'
import { useEffect, useState, useRef } from 'react'

interface ChoiceChipsProps {
  choices: Array<{
    label: string
    domain: Domain
    goto: number
  }>
  onSelect: (domain: Domain, goto: number) => void
  className?: string
}

export const ChoiceChips = ({ choices, onSelect, className }: ChoiceChipsProps) => {
  const { surface, entropy, entropyTier, modifyEntropy, addToHistory } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showFalseChoice, setShowFalseChoice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate positions in a radial pattern around last click or center
  const centerX = surface.lastClick?.x || window.innerWidth / 2
  const centerY = surface.lastClick?.y || window.innerHeight / 2
  const radius = 120

  const getChoicePosition = (index: number) => {
    const angle = (index * 2 * Math.PI) / choices.length
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    // Ensure positions stay within viewport
    const clampedX = Math.max(50, Math.min(window.innerWidth - 50, x))
    const clampedY = Math.max(50, Math.min(window.innerHeight - 50, y))
    
    return { x: clampedX, y: clampedY }
  }

  // Calculate timeout based on entropy (base 6s - entropy*12ms, min 3.2s)
  const baseTimeout = 6000
  const entropyPenalty = entropy * 12
  const timeoutMs = Math.max(3200, baseTimeout - entropyPenalty)
  
  // Auto-timeout with entropy-based timing
  useEffect(() => {
    setTimeRemaining(timeoutMs)
    
    // Show false choice in Fever tier (50-74.99 entropy)
    if (entropyTier() === 'Fever') {
      setShowFalseChoice(true)
    }
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 100
        if (newTime <= 0) {
          handleTimeout()
          return 0
        }
        return newTime
      })
    }, 100)
    
    const timeout = setTimeout(() => {
      handleTimeout()
    }, timeoutMs)
    
    setTimeoutId(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [choices, entropy, entropyTier])
  
  const handleTimeout = () => {
    // Apply "Garden Decides" - random domain, +0.1 entropy, spiteful log line
    const domains: Domain[] = ['FLESH', 'STONE', 'ASH', 'DREAM']
    const randomDomain = domains[Math.floor(Math.random() * domains.length)]
    
    modifyEntropy(0.1, 'choice-timeout')
    
    const spitefulLines = [
      "The garden chooses for you.",
      "Time runs thin, and the soil decides.",
      "Your hesitation becomes the garden's will.",
      "The earth takes what you cannot give."
    ]
    const randomLine = spitefulLines[Math.floor(Math.random() * spitefulLines.length)]
    
    addToHistory({
      id: -1,
      text: randomLine,
      ts: Date.now()
    })
    
    // Apply the random choice
    onSelect(randomDomain, 0) // goto 0 for timeout
  }
  
  const handleFalseChoice = () => {
    // False choice adds corruption and entropy, no branch
    modifyEntropy(0.15, 'false-choice')
    
    const eerieLines = [
      "The choice dissolves like mist.",
      "Your selection becomes a whisper.",
      "The garden laughs at your attempt.",
      "Reality shifts and your choice is forgotten."
    ]
    const randomLine = eerieLines[Math.floor(Math.random() * eerieLines.length)]
    
    addToHistory({
      id: -1,
      text: randomLine,
      ts: Date.now()
    })
    
    // Don't advance story, just close choices
    onSelect('FLESH' as Domain, 0) // Dummy choice to close
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + choices.length) % choices.length)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % choices.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const choice = choices[selectedIndex]
        if (choice) {
          onSelect(choice.domain, choice.goto)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        // Cancel selection - do nothing
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [choices, selectedIndex, onSelect])

  const getDomainColor = (domain: Domain) => {
    switch (domain) {
      case 'FLESH': return 'bg-red-900/30 border-red-600 text-red-300 hover:bg-red-800/40'
      case 'STONE': return 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/40'
      case 'ASH': return 'bg-orange-900/30 border-orange-600 text-orange-300 hover:bg-orange-800/40'
      case 'DREAM': return 'bg-purple-900/30 border-purple-600 text-purple-300 hover:bg-purple-800/40'
      default: return 'bg-blue-900/30 border-blue-600 text-blue-300 hover:bg-blue-800/40'
    }
  }

  // Add false choice if in Fever tier
  const displayChoices = showFalseChoice 
    ? [...choices, { label: "—", domain: 'FLESH' as Domain, goto: 0, isFalse: true }]
    : choices

  return (
    <div 
      ref={containerRef}
      className={clsx("absolute inset-0 pointer-events-auto", className)}
      role="menu"
      aria-label="Choose your path"
    >
      {/* Timeout indicator */}
      <div className="absolute top-4 left-4 bg-gray-900/80 border border-gray-600 rounded-lg p-2">
        <div className="text-xs text-gray-400 font-mono mb-1">Time remaining</div>
        <div className="w-32 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${(timeRemaining / timeoutMs) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 font-mono mt-1">
          {Math.ceil(timeRemaining / 1000)}s
        </div>
      </div>
      
      {displayChoices.map((choice, index) => {
        const position = getChoicePosition(index)
        const isSelected = index === selectedIndex
        
        return (
          <div
            key={index}
            className={clsx(
              "absolute transition-all duration-200",
              "hover:scale-110 focus-within:scale-110",
              isSelected && "ring-2 ring-white ring-offset-2 ring-offset-gray-900",
              entropy > 60 && "animate-pulse"
            )}
            style={{
              left: position.x - 40,
              top: position.y - 40,
              zIndex: 1000 + index,
            }}
          >
            <button
              onClick={() => {
                if ((choice as any).isFalse) {
                  handleFalseChoice()
                } else {
                  onSelect(choice.domain, choice.goto)
                }
              }}
              className={clsx(
                "w-20 h-12 rounded-full border-2 transition-all duration-200",
                "flex flex-col items-center justify-center space-y-1",
                "font-mono text-xs font-bold",
                "hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                (choice as any).isFalse 
                  ? "bg-gray-800/20 border-gray-500 text-gray-400 hover:bg-gray-700/30 animate-pulse"
                  : getDomainColor(choice.domain),
                isSelected && "ring-2 ring-white ring-offset-2 ring-offset-gray-900",
                entropy > 60 && "animate-pulse"
              )}
              role="menuitem"
              aria-label={`Choose ${choice.domain}: ${choice.label}`}
              tabIndex={isSelected ? 0 : -1}
            >
              <div className="text-lg">
                {(choice as any).isFalse ? '?' :
                 choice.domain === 'FLESH' ? '●' :
                 choice.domain === 'STONE' ? '■' :
                 choice.domain === 'ASH' ? '▲' : '◊'}
              </div>
              <div className="text-xs leading-tight text-center">
                {choice.label}
              </div>
            </button>
          </div>
        )
      })}
      
      {/* Selection indicator */}
      {choices.length > 0 && (
        <div 
          className="absolute pointer-events-none"
          style={{
            left: getChoicePosition(selectedIndex).x - 50,
            top: getChoicePosition(selectedIndex).y - 50,
            width: 100,
            height: 100,
            zIndex: 999,
          }}
        >
          <div className="w-full h-full border-2 border-white rounded-full animate-ping opacity-50" />
        </div>
      )}
    </div>
  )
}
