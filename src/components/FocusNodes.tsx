import { useGameStore } from '../lib/store'
import { Domain } from '../lib/types'
import { entropyBindings } from '../lib/entropyBindings'
import { SeedSVG, GodClusterSVG } from '../assets/svg'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

interface FocusNodesProps {
  className?: string
}

export const FocusNodes = ({ className }: FocusNodesProps) => {
  const { focus, domainAlignments, entropy } = useGameStore()
  const [ripples, setRipples] = useState<Array<{id: string, x: number, y: number, size: number}>>([])

  const handleSeedClick = (focusId: string, x: number, y: number) => {
    // Increment seed count
    useGameStore.getState().incrementSeed()
    
    // Add entropy
    useGameStore.getState().tickEntropy(1)
    entropyBindings.updateEntropy(entropy + 1)
    
    // Emit seed bonus event
    entropyBindings.onSeedFlag()
    
    // Create ripple effect
    const rippleId = `ripple-${Date.now()}`
    setRipples(prev => [...prev, { id: rippleId, x, y, size: 20 }])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId))
    }, 600)
    
    // Remove focus node
    useGameStore.getState().despawnFocus(focusId)
  }

  const handleGodClick = (focusId: string, x: number, y: number, currentDomain?: Domain) => {
    // Cycle through domains
    const domains: Domain[] = ['FLESH', 'STONE', 'ASH', 'DREAM']
    const currentIndex = currentDomain ? domains.indexOf(currentDomain) : -1
    const nextDomain = domains[(currentIndex + 1) % domains.length]
    
    // Update domain alignment
    useGameStore.getState().updateDomainAlignment(nextDomain, 1)
    
    // Emit domain cycle event
    entropyBindings.onCorruptionInject(`The ${nextDomain.toLowerCase()} god stirs...`, [nextDomain.toLowerCase()])
    
    // Create bloom effect
    const rippleId = `bloom-${Date.now()}`
    setRipples(prev => [...prev, { id: rippleId, x, y, size: 40 }])
    
    // Remove bloom after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId))
    }, 800)
    
    // Update focus node domain
    // Note: In a real implementation, you'd update the focus node's domain
    // For now, we'll just remove it and let the story engine spawn a new one
    useGameStore.getState().despawnFocus(focusId)
  }

  const getDomainColor = (domain?: Domain) => {
    switch (domain) {
      case 'FLESH': return 'text-red-400'
      case 'STONE': return 'text-gray-400'
      case 'ASH': return 'text-orange-400'
      case 'DREAM': return 'text-purple-400'
      default: return 'text-blue-400'
    }
  }

  return (
    <div className={clsx("absolute inset-0 pointer-events-none", className)}>
      {/* Focus nodes */}
      {focus.map((node) => {
        const age = Date.now() - node.bornAt
        const opacity = Math.max(0.3, 1 - (age / node.ttlMs))
        const scale = 0.8 + (age / node.ttlMs) * 0.2
        
        return (
          <div
            key={node.id}
            className="absolute pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              left: node.x - 16,
              top: node.y - 16,
              opacity,
              transform: `scale(${scale})`,
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (node.kind === 'seed') {
                handleSeedClick(node.id, node.x, node.y)
              } else {
                handleGodClick(node.id, node.x, node.y, node.domain)
              }
            }}
          >
            {node.kind === 'seed' ? (
              <img 
                src={SeedSVG} 
                alt="Seed" 
                className="w-8 h-8 animate-pulse" 
              />
            ) : (
              <img 
                src={GodClusterSVG} 
                alt="God Cluster" 
                className="w-8 h-8 animate-pulse" 
              />
            )}
            
            {/* Domain indicator for gods */}
            {node.kind === 'god' && node.domain && (
              <div className={clsx(
                "absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-mono",
                getDomainColor(node.domain)
              )}>
                {node.domain}
              </div>
            )}
          </div>
        )
      })}
      
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        >
          <div
            className="w-full h-full border-2 border-green-400 rounded-full animate-ping"
            style={{
              animationDuration: '0.6s',
              animationIterationCount: 1,
            }}
          />
        </div>
      ))}
    </div>
  )
}
