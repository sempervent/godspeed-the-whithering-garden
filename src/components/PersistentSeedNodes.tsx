import React from 'react'
import { useGameStore } from '../lib/store'
import { SeedState, Season } from '../lib/types'
import clsx from 'clsx'

export const PersistentSeedNodes = () => {
  const { persistentSeeds, feedSeed, season } = useGameStore()
  const now = Date.now()

  const getSeasonColor = (season: Season) => {
    switch (season) {
      case 'SPRING': return 'text-green-400'
      case 'SUMMER': return 'text-yellow-400'
      case 'AUTUMN': return 'text-orange-400'
      case 'WINTER': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getStateColor = (state: SeedState) => {
    switch (state) {
      case 'PLANTED': return 'text-gray-400'
      case 'GROWING': return 'text-green-300'
      case 'MATURE': return 'text-green-500'
      case 'STARVED': return 'text-gray-500'
      case 'AWAKENED': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <>
      {Object.values(persistentSeeds).map(seed => {
        const isStarved = seed.state === 'STARVED'
        const isMature = seed.state === 'MATURE'
        const isGrowing = seed.state === 'GROWING'
        const isPlanted = seed.state === 'PLANTED'

        return (
          <div
            key={seed.id}
            className={clsx(
              "absolute w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-300",
              "hover:scale-110",
              {
                "opacity-50": isStarved,
                "animate-pulse": isMature,
                "pointer-events-auto": !isStarved,
                "pointer-events-none": isStarved,
              }
            )}
            style={{
              left: seed.x,
              top: seed.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}
            onClick={() => !isStarved && feedSeed(seed.id, now)}
            title={`${seed.state} - Food: ${(seed.food * 100).toFixed(0)}% - Maturity: ${(seed.maturity * 100).toFixed(0)}%`}
          >
            {/* Seed icon */}
            <div className={clsx(
              "w-full h-full rounded-full border-2 flex items-center justify-center text-lg",
              getStateColor(seed.state),
              getSeasonColor(season),
              {
                "bg-gray-800/50": isStarved,
                "bg-green-900/30": isGrowing,
                "bg-green-800/50": isMature,
                "bg-gray-700/30": isPlanted,
              }
            )}>
              {isStarved ? '☠' : isMature ? '●' : isGrowing ? '◐' : '○'}
            </div>

            {/* Hunger ring */}
            {!isStarved && (
              <div
                className="absolute inset-0 border-2 border-red-400 rounded-full opacity-50"
                style={{
                  transform: `scale(${1 - seed.food})`,
                  transition: 'transform 0.1s linear'
                }}
              />
            )}

            {/* Maturity halo */}
            {isMature && (
              <div
                className="absolute inset-0 border-2 border-green-400 rounded-full opacity-30 animate-ping"
                style={{
                  transform: 'scale(1.2)'
                }}
              />
            )}

            {/* Starvation ash effect */}
            {isStarved && (
              <div className="absolute inset-0 bg-gray-500/20 rounded-full animate-pulse" />
            )}
          </div>
        )
      })}
    </>
  )
}
