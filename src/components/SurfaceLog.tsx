import { useGameStore } from '../lib/store'
import { useStory } from '../lib/storyEngine'
import { entropyBindings } from '../lib/entropyBindings'
import { parseTags } from '../lib/tags'
import clsx from 'clsx'
import { useEffect, useState, useRef } from 'react'

interface SurfaceLogProps {
  className?: string
}

export const SurfaceLog = ({ className }: SurfaceLogProps) => {
  const { history, entropy, surface } = useGameStore()
  const storyEngine = useStory()
  const [visibleLines, setVisibleLines] = useState<Array<{id: string, text: string, x: number, y: number, opacity: number}>>([])
  const lastProcessedIndex = useRef(-1)

  // Show last N lines (responsive)
  const maxLines = window.innerWidth < 768 ? 5 : 8

  // Update visible lines when history changes
  useEffect(() => {
    if (history.length === 0 || history.length <= lastProcessedIndex.current) return

    const lastEntry = history[history.length - 1]
    const clickPos = surface.lastClick || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    
    // Add new line at click position
    const newLine = {
      id: `line-${lastEntry.id}-${Date.now()}`,
      text: lastEntry.text,
      x: clickPos.x,
      y: clickPos.y,
      opacity: 1
    }

    setVisibleLines(prev => {
      const updated = [...prev, newLine]
      // Keep only the most recent lines
      return updated.slice(-maxLines)
    })

    // Animate drift to overlay column
    setTimeout(() => {
      setVisibleLines(prev => 
        prev.map(line => 
          line.id === newLine.id 
            ? { ...line, x: window.innerWidth - 200, y: 100 + (prev.length - 1) * 60, opacity: 0.8 }
            : line
        )
      )
    }, 100)

    // Update last processed index
    lastProcessedIndex.current = history.length - 1
  }, [history.length, surface.lastClick, maxLines])

  // Handle corruption updates only (mood updates moved to ClickSurface)
  useEffect(() => {
    if (history.length === 0) return

    const lastEntry = history[history.length - 1]
    
    // Handle corruption lines - only check if entropy is high enough to cause corruption
    if (entropy > 10) {
      const parsed = parseTags(lastEntry.text)
      if (parsed.tags.length > 0) {
        entropyBindings.onCorruptionInject(lastEntry.text, parsed.tags)
      }
    }
  }, [history.length, entropy]) // Remove storyEngine dependency

  return (
    <div className={clsx("absolute top-0 right-0 w-64 h-full pointer-events-none", className)}>
      {visibleLines.map((line, index) => (
        <div
          key={line.id}
          className={clsx(
            "absolute p-3 rounded-lg border transition-all duration-1000 ease-out",
            "bg-gray-900/80 backdrop-blur-sm border-gray-700",
            "text-sm font-mono text-gray-300 leading-relaxed",
            entropy > 60 && index === visibleLines.length - 1 && 'animate-pulse'
          )}
          style={{
            left: line.x - 100,
            top: line.y - 20,
            opacity: line.opacity,
            transform: `translate(${line.x > window.innerWidth - 300 ? '0' : '0'}, 0)`,
            zIndex: 1000 - index
          }}
        >
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-500 font-mono flex-shrink-0 mt-1">
              {index + 1}
            </span>
            <div className="flex-1">
              <p
                className={clsx(
                  'text-sm leading-relaxed',
                  entropy > 60 && 'animate-glitch'
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
                dangerouslySetInnerHTML={{ 
                  __html: storyEngine.applyEntropy(line.text, entropy) 
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
