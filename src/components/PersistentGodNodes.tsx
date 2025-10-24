import React from 'react'
import { useGameStore } from '../lib/store'
import { Domain } from '../lib/types'
import clsx from 'clsx'

export const PersistentGodNodes = () => {
  const { persistentGods, clickGod } = useGameStore()
  const now = Date.now()

  const getDomainColor = (domain: Domain) => {
    switch (domain) {
      case 'FLESH': return 'text-red-400'
      case 'STONE': return 'text-gray-400'
      case 'ASH': return 'text-orange-400'
      case 'DREAM': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getDomainIcon = (domain: Domain) => {
    switch (domain) {
      case 'FLESH': return '●'
      case 'STONE': return '■'
      case 'ASH': return '▲'
      case 'DREAM': return '◊'
      default: return '?'
    }
  }

  return (
    <>
      {Object.values(persistentGods).map(god => {
        const isOnCooldown = now < god.cooldownUntil
        const cooldownRemaining = Math.max(0, god.cooldownUntil - now)

        return (
          <div
            key={god.id}
            className={clsx(
              "absolute w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300",
              "hover:scale-110",
              {
                "opacity-50 cursor-not-allowed": isOnCooldown,
                "animate-pulse": !isOnCooldown,
                "pointer-events-auto": !isOnCooldown,
                "pointer-events-none": isOnCooldown,
              }
            )}
            style={{
              left: god.x,
              top: god.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 25
            }}
            onClick={() => !isOnCooldown && clickGod(god.id, now)}
            title={isOnCooldown ? 
              `Cooldown: ${Math.ceil(cooldownRemaining / 1000)}s` : 
              `${god.domain} God - Favor: ${god.favor} - Price: ${god.price}`
            }
          >
            {/* God icon */}
            <div className={clsx(
              "w-full h-full rounded-full border-2 flex items-center justify-center text-xl font-bold",
              getDomainColor(god.domain),
              {
                "bg-red-900/30": god.domain === 'FLESH',
                "bg-gray-800/30": god.domain === 'STONE',
                "bg-orange-900/30": god.domain === 'ASH',
                "bg-purple-900/30": god.domain === 'DREAM',
              }
            )}>
              {getDomainIcon(god.domain)}
            </div>

            {/* Cooldown ring */}
            {isOnCooldown && (
              <div
                className="absolute inset-0 border-2 border-gray-500 rounded-full opacity-50"
                style={{
                  transform: `scale(${1 - (cooldownRemaining / 8000)})`,
                  transition: 'transform 0.1s linear'
                }}
              />
            )}

            {/* Awakening effect */}
            {!isOnCooldown && (
              <div className="absolute inset-0 border-2 border-white rounded-full opacity-20 animate-ping" />
            )}

            {/* Domain label */}
            <div className={clsx(
              "absolute -bottom-6 text-xs font-mono text-center",
              getDomainColor(god.domain)
            )}>
              {god.domain}
            </div>
          </div>
        )
      })}
    </>
  )
}
