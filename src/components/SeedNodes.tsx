import React from 'react'
import { useGameStore } from '../lib/store'
import { SeedSVG } from '../assets/svg'
import clsx from 'clsx'

interface SeedNodesProps {
  className?: string
}

export const SeedNodes = ({ className }: SeedNodesProps) => {
  const { seedsAlive, clickSeed } = useGameStore()

  const handleSeedClick = (e: React.MouseEvent, seedId: string) => {
    e.stopPropagation()
    const now = Date.now()
    clickSeed(seedId, now)
  }

  return (
    <div className={clsx("absolute inset-0 pointer-events-none", className)}>
      {Object.values(seedsAlive).map(seed => {
        const now = Date.now()
        const age = now - seed.bornAt
        const viabilityProgress = Math.min(1, age / seed.viableMs)
        const isExpired = seed.expired
        const isRot = seed.expired && seed.rotUntil && now < seed.rotUntil

        return (
          <div
            key={seed.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: seed.x - 16,
              top: seed.y - 16,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => handleSeedClick(e, seed.id)}
          >
            {/* Viability ring */}
            {!isExpired && (
              <div
                className="absolute inset-0 border-2 border-green-400 rounded-full opacity-60"
                style={{
                  width: 32,
                  height: 32,
                  left: -16,
                  top: -16,
                  borderDasharray: '100 100',
                  strokeDashoffset: viabilityProgress * 100,
                  animation: 'spin 2s linear infinite'
                }}
              />
            )}
            
            {/* Seed icon */}
            <div
              className={clsx(
                "w-8 h-8 transition-all duration-300",
                isRot ? "opacity-60 grayscale" : "opacity-100",
                isExpired && !isRot ? "opacity-30" : ""
              )}
            >
              <img 
                src={SeedSVG} 
                alt={isExpired ? "Spoiled seed" : "Viable seed"}
                className="w-full h-full"
              />
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              {isRot ? "Spoiled" : isExpired ? "Expired" : "Viable"}
            </div>
          </div>
        )
      })}
    </div>
  )
}
