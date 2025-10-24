import { useEffect } from 'react'
import { ClickSurface } from './components/ClickSurface'
import { HUD } from './components/HUD'
import { LogPane } from './components/LogPane'
import { useStory } from './lib/storyEngine'
import { audioEngine } from './audio/audioEngine'
import { entropyBindings } from './lib/entropyBindings'

function App() {
  const storyEngine = useStory()

  // Load the story on mount
  useEffect(() => {
    const loadStory = async () => {
      try {
        await storyEngine.loadStory()
        await storyEngine.loadCorruption()
        console.log('✅ Story and corruption loaded')
      } catch (error) {
        console.error('❌ Failed to load story:', error)
      }
    }
    loadStory()
  }, [storyEngine])

  // Initialize atmosphere system on first user interaction
  useEffect(() => {
    const initializeAtmosphere = async () => {
      try {
        await audioEngine.resumeContext()
        console.log('🎵 Audio engine initialized on first interaction')
        
        // Start ambient drone
        await audioEngine.ensureLoop('amb.drone.low')
        console.log('🎵 Started ambient drone')
      } catch (error) {
        console.warn('Failed to initialize audio engine:', error)
      }
    }

    // Initialize on first click or keypress
    const handleFirstInteraction = () => {
      initializeAtmosphere()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }

    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left panel - HUD */}
        <HUD />

        {/* Center panel - Click surface */}
        <ClickSurface className="flex-1" />

        {/* Right panel - Log */}
        <LogPane />
      </div>

      {/* Mobile responsive overlay */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-300 font-mono text-center">
            Tap to advance • Desktop recommended for full experience
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
