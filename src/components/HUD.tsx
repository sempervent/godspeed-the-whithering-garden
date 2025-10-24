import { useState, useEffect } from 'react'
import { useGameStore } from '../lib/store'
import { Domain } from '../lib/types'
import { userSettings } from '../settings/userSettings'
import { audioEngine } from '../audio/audioEngine'
import clsx from 'clsx'

const domainColors: Record<Domain, string> = {
  FLESH: 'text-red-400',
  STONE: 'text-gray-400',
  ASH: 'text-orange-400',
  DREAM: 'text-purple-400',
}

const domainLabels: Record<Domain, string> = {
  FLESH: 'FLESH',
  STONE: 'STONE',
  ASH: 'ASH',
  DREAM: 'DREAM',
}

export const HUD = () => {
  const { 
    seeds, 
    awakened, 
    entropy, 
    getEntropy,
    entropyTier,
    lineIndex, 
    domainAlignments, 
    dominantGod,
    saveSlot,
    save,
    load,
    exportSave,
    importSave,
    resetRun,
    // Persistent ecology
    persistentSeeds,
    persistentGods,
    season,
    seasonCount,
    stats,
    runOver,
    score,
    ending,
    lastScoreboard,
    hardReset
  } = useGameStore()

  const [masterVolume, setMasterVolume] = useState(userSettings.getMasterVolume())
  const [isMuted, setIsMuted] = useState(userSettings.isMuted())
  const [reduceMotion, setReduceMotion] = useState(userSettings.shouldReduceMotion())
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [activeLoops, setActiveLoops] = useState<string[]>([])
  const [showRestartModal, setShowRestartModal] = useState(false)

  const handleSave = () => {
    save()
  }

  const handleLoad = (slot: 'A' | 'B' | 'C') => {
    load(slot)
  }

  const handleExport = () => {
    const saveData = exportSave()
    const blob = new Blob([saveData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `godseed-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const json = e.target?.result as string
          if (importSave(json)) {
            alert('Save imported successfully!')
          } else {
            alert('Failed to import save file.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    userSettings.setMasterVolume(volume)
    audioEngine.updateMasterVolume(volume)
  }

  const handleMuteToggle = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    userSettings.setMuted(newMuted)
    audioEngine.updateMasterVolume(newMuted ? 0 : masterVolume)
  }

  const handleReduceMotionToggle = () => {
    const newReduceMotion = !reduceMotion
    setReduceMotion(newReduceMotion)
    userSettings.setReduceMotion(newReduceMotion)
  }

  const handleDebugToggle = () => {
    setShowDebugPanel(!showDebugPanel)
  }

  const handleRestart = () => {
    setShowRestartModal(true)
  }

  const handleRestartConfirm = () => {
    resetRun(false)
    setShowRestartModal(false)
  }

  const handleRestartCancel = () => {
    setShowRestartModal(false)
  }

  // Keyboard shortcut for restart (Shift+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'R') {
        e.preventDefault()
        handleRestart()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Update active loops for debug display
  useEffect(() => {
    const updateActiveLoops = () => {
      const activeElements = document.querySelectorAll('[data-audio-active]')
      const loops = Array.from(activeElements).map(el => el.getAttribute('data-audio-active') || '')
      setActiveLoops(loops.filter(Boolean))
    }

    const interval = setInterval(updateActiveLoops, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-6 space-y-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-mono text-gray-300">
            Garden Status
          </h2>
          <button
            onClick={handleRestart}
            className={clsx(
              "px-3 py-1 text-xs font-mono rounded-full border transition-all duration-200",
              "bg-red-900/20 border-red-600 text-red-300 hover:bg-red-800/30 hover:border-red-500",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            )}
            title="Restart the garden (Shift+R)"
          >
            RESTART
          </button>
        </div>

        {/* Seeds counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono">Seeds</span>
            <span
              className={clsx(
                'text-lg font-mono font-bold transition-colors duration-300',
                seeds > 0 ? 'text-green-400' : 'text-gray-500'
              )}
            >
              {seeds}
            </span>
          </div>
          {seeds > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (seeds / 5) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Awakened counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono">Awakened</span>
            <span
              className={clsx(
                'text-lg font-mono font-bold transition-colors duration-300',
                awakened > 0 ? 'text-blue-400' : 'text-gray-500'
              )}
            >
              {awakened}
            </span>
          </div>
          {awakened > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (awakened / 3) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Domain Alignments */}
        <div className="space-y-2">
          <span className="text-sm text-gray-400 font-mono">Alignments</span>
          {Object.entries(domainAlignments).map(([domain, value]) => (
            <div key={domain} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={clsx('text-xs font-mono', domainColors[domain as Domain])}>
                  {domainLabels[domain as Domain]}
                </span>
                <span className="text-xs text-gray-500 font-mono">{value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className={clsx(
                    'h-1 rounded-full transition-all duration-500',
                    domain === 'FLESH' ? 'bg-red-400' :
                    domain === 'STONE' ? 'bg-gray-400' :
                    domain === 'ASH' ? 'bg-orange-400' : 'bg-purple-400'
                  )}
                  style={{ width: `${Math.min(100, (value / 10) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Dominant God */}
        {dominantGod && (
          <div className="space-y-2">
            <span className="text-sm text-gray-400 font-mono">Dominant</span>
            <div className={clsx(
              'p-2 rounded border text-center font-mono text-sm',
              domainColors[dominantGod],
              'border-current bg-black/20'
            )}>
              {domainLabels[dominantGod]}
            </div>
          </div>
        )}

        {/* Entropy meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono">Entropy</span>
            <span
              className={clsx(
                'text-lg font-mono font-bold transition-colors duration-300',
                getEntropy() > 60 ? 'text-red-400' : getEntropy() > 30 ? 'text-yellow-400' : 'text-gray-500'
              )}
            >
              {getEntropy().toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                getEntropy() > 60 ? 'bg-red-400' : getEntropy() > 30 ? 'bg-yellow-400' : 'bg-gray-500'
              )}
              style={{ width: `${getEntropy()}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Tier: {entropyTier()}
          </div>
            {getEntropy() > 60 && (
              <p className="text-xs text-red-400 font-mono animate-pulse">
                The garden trembles...
              </p>
            )}
          </div>

          {/* Season and Ecology */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-mono">Season</span>
              <span className={clsx(
                'text-lg font-mono font-bold',
                season === 'SPRING' ? 'text-green-400' :
                season === 'SUMMER' ? 'text-yellow-400' :
                season === 'AUTUMN' ? 'text-orange-400' :
                'text-blue-400'
              )}>
                {season}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Cycle: {seasonCount} | Seeds: {Object.keys(persistentSeeds).length} | Gods: {Object.keys(persistentGods).length}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="text-sm text-gray-400 font-mono">Ecology Stats</div>
            <div className="text-xs text-gray-500 font-mono space-y-1">
              <div>Awakened: {stats.awakened}</div>
              <div>Harvested: {stats.harvested}</div>
              <div>Starved: {stats.starved}</div>
              <div>Choices: {stats.choicesMade}</div>
            </div>
          </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono">Progress</span>
            <span className="text-sm text-gray-500 font-mono">{lineIndex}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-gray-400 h-1 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (lineIndex / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Save/Load Controls */}
      <div className="space-y-3 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-mono text-gray-400">Save System</h3>
        
        {/* Save Slots */}
        <div className="space-y-2">
          <div className="flex space-x-1">
            {(['A', 'B', 'C'] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => handleLoad(slot)}
                className={clsx(
                  'px-2 py-1 text-xs font-mono rounded border transition-colors',
                  saveSlot === slot 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full px-3 py-1 text-xs font-mono bg-green-600 hover:bg-green-700 text-white rounded border border-green-500 transition-colors"
          >
            Save
          </button>
        </div>

        {/* Import/Export */}
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full px-3 py-1 text-xs font-mono bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-500 transition-colors"
          >
            Export Save
          </button>
          <button
            onClick={handleImport}
            className="w-full px-3 py-1 text-xs font-mono bg-purple-600 hover:bg-purple-700 text-white rounded border border-purple-500 transition-colors"
          >
            Import Save
          </button>
        </div>
      </div>

      {/* Atmosphere Controls */}
      <div className="space-y-3 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-mono text-gray-400">Atmosphere</h3>
        
        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">Volume</span>
            <button
              onClick={handleMuteToggle}
              className={clsx(
                'px-2 py-1 text-xs font-mono rounded border transition-colors',
                isMuted 
                  ? 'bg-red-600 border-red-400 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              )}
            >
              {isMuted ? 'MUTED' : 'ON'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={masterVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            disabled={isMuted}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Reduce Motion */}
        <div className="space-y-2">
          <button
            onClick={handleReduceMotionToggle}
            className={clsx(
              'w-full px-3 py-1 text-xs font-mono rounded border transition-colors',
              reduceMotion 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            )}
          >
            {reduceMotion ? 'REDUCE MOTION: ON' : 'REDUCE MOTION: OFF'}
          </button>
        </div>

        {/* Audio Test */}
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log('🎵 Testing audio...')
              audioEngine.playOne('sfx.chime.glass')
            }}
            className="w-full px-3 py-1 text-xs font-mono rounded border bg-green-600 border-green-400 text-white hover:bg-green-500 transition-colors"
          >
            TEST AUDIO
          </button>
        </div>

        {/* Debug Panel Toggle */}
        <div className="space-y-2">
          <button
            onClick={handleDebugToggle}
            className={clsx(
              'w-full px-3 py-1 text-xs font-mono rounded border transition-colors',
              showDebugPanel 
                ? 'bg-purple-600 border-purple-400 text-white' 
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            )}
          >
            {showDebugPanel ? 'DEBUG: ON' : 'DEBUG: OFF'}
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-mono text-gray-400">Audio Debug</h3>
          
          {/* Active Loops */}
          <div className="space-y-2">
            <span className="text-xs text-gray-400 font-mono">Active Loops:</span>
            {activeLoops.length > 0 ? (
              <div className="space-y-1">
                {activeLoops.map((loop, index) => (
                  <div key={index} className="text-xs text-green-400 font-mono">
                    {loop}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 font-mono">None</div>
            )}
          </div>

          {/* Loop Metadata */}
          <div className="space-y-2">
            <span className="text-xs text-gray-400 font-mono">Loop Metadata:</span>
            <div className="text-xs text-gray-300 font-mono space-y-1">
              {Object.entries(audioEngine.getAllLoopMetadata()).map(([filename, meta]: [string, any]) => (
                <div key={filename} className="border-l-2 border-gray-600 pl-2">
                  <div className="text-green-400">{filename}</div>
                  <div className="text-gray-400">
                    {meta.isLoopable ? '🔄' : '🎯'} 
                    {meta.isLoopable ? 'Loopable' : 'One-shot'} 
                    (conf: {meta.confidence?.toFixed(2) || 'N/A'})
                  </div>
                  {meta.isLoopable && (
                    <div className="text-gray-500">
                      Start: {meta.loopStart} | End: {meta.loopEnd} | Fade: {meta.crossfadeMs}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status messages */}
      <div className="space-y-2 pt-4 border-t border-gray-700">
        {seeds === 0 && awakened === 0 && (
          <p className="text-xs text-gray-500 font-mono">
            Begin your journey...
          </p>
        )}
        {seeds > 0 && awakened === 0 && (
          <p className="text-xs text-green-400 font-mono">
            Seeds take root...
          </p>
        )}
        {seeds > 0 && awakened > 0 && (
          <p className="text-xs text-blue-400 font-mono">
            The garden awakens...
          </p>
        )}
        {entropy > 60 && (
          <p className="text-xs text-red-400 font-mono animate-pulse">
            Chaos approaches...
          </p>
        )}
        {dominantGod && (
          <p className={clsx('text-xs font-mono', domainColors[dominantGod])}>
            {dominantGod} domain dominant...
          </p>
        )}
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-mono text-gray-300 mb-4">
              Burn this garden?
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-6">
              This will reset all progress, seeds, and awakened gods. The cycle begins anew.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRestartConfirm}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-mono rounded border transition-all duration-200",
                  "bg-red-900/30 border-red-600 text-red-300 hover:bg-red-800/40 hover:border-red-500",
                  "focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
              >
                BURN IT
              </button>
              <button
                onClick={handleRestartCancel}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-mono rounded border transition-all duration-200",
                  "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-gray-500"
                )}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score and Ending Overlay */}
      {runOver && ending && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-lg mx-4 text-center">
            <h2 className="text-2xl font-mono text-gray-300 mb-4">
              {ending.type === 'AscendantChorus' ? 'ASCENDANT CHORUS' :
               ending.type === 'GardenFamine' ? 'GARDEN FAMINE' :
               'STONE SLEEP'}
            </h2>
            <p className="text-lg font-mono text-gray-400 mb-6">
              {ending.type === 'AscendantChorus' ? 'The gods sing in harmony. The garden flourishes.' :
               ending.type === 'GardenFamine' ? 'The garden withers. Life fades to dust.' :
               'The garden sleeps. Silence reigns.'}
            </p>
            <div className="text-3xl font-mono text-green-400 mb-6">
              Score: {score}
            </div>
            <div className="flex space-x-3 justify-center">
              <button 
                onClick={() => hardReset()} 
                className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 font-mono"
              >
                RESTART
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 font-mono"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
