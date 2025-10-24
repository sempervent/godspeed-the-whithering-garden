import { useGameStore } from '../lib/store'
import { BreathingSoilSVG } from '../assets/svg'
import clsx from 'clsx'

interface SurfaceBackgroundProps {
  className?: string
}

export const SurfaceBackground = ({ className }: SurfaceBackgroundProps) => {
  const { mood, entropy } = useGameStore()

  // Calculate mood-based gradient stops
  const getMoodGradient = () => {
    const { flesh, stone, ash, dream } = mood
    const total = flesh + stone + ash + dream || 1
    
    // Normalize mood values
    const fleshRatio = flesh / total
    const stoneRatio = stone / total
    const ashRatio = ash / total
    const dreamRatio = dream / total
    
    // Base colors
    const baseColors = {
      flesh: '#a31621',
      stone: '#5e3a7a', 
      ash: '#c2a35e',
      dream: '#5fa56b'
    }
    
    // Calculate weighted color
    const r = Math.round(
      (fleshRatio * 163) + (stoneRatio * 94) + (ashRatio * 194) + (dreamRatio * 95)
    )
    const g = Math.round(
      (fleshRatio * 22) + (stoneRatio * 58) + (ashRatio * 163) + (dreamRatio * 165)
    )
    const b = Math.round(
      (fleshRatio * 33) + (stoneRatio * 122) + (ashRatio * 94) + (dreamRatio * 107)
    )
    
    return `rgb(${r}, ${g}, ${b})`
  }

  const moodColor = getMoodGradient()
  
  return (
    <div 
      className={clsx(
        "absolute inset-0 transition-all duration-1000",
        className
      )}
      style={{
        background: `radial-gradient(ellipse at center, ${moodColor}15 0%, #0b0b0f 70%)`,
        filter: entropy > 60 ? `hue-rotate(${entropy * 2}deg) saturate(${1 + entropy / 100})` : 'none'
      }}
    >
      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url(${BreathingSoilSVG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Entropy-based distortion */}
      {entropy > 40 && (
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 0%, ${moodColor}20 50%, transparent 100%)`,
            animation: entropy > 80 ? 'pulse 0.5s infinite' : 'none'
          }}
        />
      )}
    </div>
  )
}
