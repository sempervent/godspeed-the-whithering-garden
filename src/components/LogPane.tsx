import { useEffect, useRef } from 'react'
import { useGameStore } from '../lib/store'
import { useStory } from '../lib/storyEngine'
import { entropyBindings } from '../lib/entropyBindings'
import { parseTags } from '../lib/tags'
import clsx from 'clsx'

export const LogPane = () => {
  const { history, entropy } = useGameStore()
  const storyEngine = useStory()
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [history])

  // Apply entropy effects to text
  const applyEntropyToText = (text: string) => {
    const corrupted = storyEngine.applyEntropy(text, entropy)
    
    // Check if this is a corruption line (negative ID)
    if (text !== corrupted) {
      const parsed = parseTags(corrupted)
      if (parsed.tags.length > 0) {
        entropyBindings.onCorruptionInject(corrupted, parsed.tags)
      }
    }
    
    return corrupted
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-mono text-gray-300">Garden Log</h3>
        <p className="text-xs text-gray-500 font-mono">
          {history.length} entries
        </p>
      </div>

      <div
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 #1f2937',
        }}
      >
        {history.length === 0 ? (
          <div className="text-center text-gray-500 font-mono text-sm py-8">
            <p>The garden awaits your touch...</p>
            <p className="mt-2 text-xs">Click to begin the story</p>
          </div>
        ) : (
          history.map((entry, index) => (
            <div
              key={`${entry.id}-${index}`}
              data-testid="log-entry"
              className={clsx(
                'p-3 rounded-lg border transition-all duration-300',
                'bg-gray-800 border-gray-700',
                'hover:bg-gray-750 hover:border-gray-600',
                entropy > 60 && index === history.length - 1 && 'animate-pulse'
              )}
            >
              <div className="flex items-start space-x-2">
                <span className="text-xs text-gray-500 font-mono flex-shrink-0 mt-1">
                  {String(entry.id).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p
                    className={clsx(
                      'text-sm font-mono leading-relaxed',
                      'text-gray-300',
                      entropy > 60 && 'animate-glitch'
                    )}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {applyEntropyToText(entry.text)}
                  </p>
                  {entry.flags && (
                    <div className="flex space-x-2 mt-2">
                      {entry.flags.seed && (
                        <span className="text-xs text-green-400 font-mono">
                          SEED
                        </span>
                      )}
                      {entry.flags.awaken && (
                        <span className="text-xs text-blue-400 font-mono">
                          AWAKEN
                        </span>
                      )}
                      {entry.flags.branch && (
                        <span className={clsx(
                          'text-xs font-mono',
                          entry.flags.branch === 'FLESH' ? 'text-red-400' :
                          entry.flags.branch === 'STONE' ? 'text-gray-400' :
                          entry.flags.branch === 'ASH' ? 'text-orange-400' : 'text-purple-400'
                        )}>
                          {entry.flags.branch}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Entropy warning */}
      {entropy > 60 && (
        <div className="p-3 bg-red-900/20 border-t border-red-700">
          <p className="text-xs text-red-400 font-mono animate-pulse">
            ⚠ The garden's memory fragments...
          </p>
        </div>
      )}
    </div>
  )
}
