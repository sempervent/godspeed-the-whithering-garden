import React, { useState } from 'react'
import { useGameStore } from '../lib/store'
import { GodClusterSVG } from '../assets/svg'
import { Domain, Boon, Price } from '../lib/types'
import clsx from 'clsx'

interface GodNodesProps {
  className?: string
}

const boonOptions: { boon: Boon; label: string; description: string }[] = [
  { boon: 'Harvest', label: 'Harvest', description: 'Next 3 seeds +2s viability' },
  { boon: 'Stillness', label: 'Stillness', description: 'Entropy decay ×1.6 for 20s' },
  { boon: 'Veil', label: 'Veil', description: 'Suppress corruption for 2 lines' },
  { boon: 'Echo', label: 'Echo', description: 'Duplicate next line\'s reward' }
]

const priceOptions: { price: Price; label: string; description: string }[] = [
  { price: 'TithedBreath', label: 'Tithed Breath', description: 'Entropy baseline +0.05 for 60s' },
  { price: 'StoneDue', label: 'Stone Due', description: 'Choices timeout 1s faster for 2 prompts' },
  { price: 'AshTax', label: 'Ash Tax', description: 'Missed seed penalty +50%' },
  { price: 'DreamDebt', label: 'Dream Debt', description: 'Random line reorders 1 word for next 4 lines' }
]

const domainColors: Record<Domain, string> = {
  FLESH: 'text-red-400 border-red-400',
  STONE: 'text-gray-400 border-gray-400',
  ASH: 'text-orange-400 border-orange-400',
  DREAM: 'text-purple-400 border-purple-400'
}

export const GodNodes = ({ className }: GodNodesProps) => {
  const { godsAlive, clickGod, applyBoon, applyPrice } = useGameStore()
  const [bargainWheel, setBargainWheel] = useState<{ godId: string; x: number; y: number } | null>(null)

  const handleGodClick = (e: React.MouseEvent, godId: string, x: number, y: number) => {
    e.stopPropagation()
    const now = Date.now()
    clickGod(godId, now)
    
    // Open bargain wheel
    setBargainWheel({ godId, x, y })
  }

  const handleBoonSelect = (boon: Boon) => {
    if (!bargainWheel) return
    
    const now = Date.now()
    const duration = boon === 'Harvest' ? 30000 : boon === 'Stillness' ? 20000 : boon === 'Veil' ? 10000 : 15000
    applyBoon(boon, now + duration)
    
    // Apply random price
    const randomPrice = priceOptions[Math.floor(Math.random() * priceOptions.length)]
    const priceDuration = randomPrice.price === 'TithedBreath' ? 60000 : 
                         randomPrice.price === 'StoneDue' ? 20000 :
                         randomPrice.price === 'AshTax' ? 30000 : 40000
    applyPrice(randomPrice.price, now + priceDuration)
    
    setBargainWheel(null)
  }

  const handleBargainClose = () => {
    setBargainWheel(null)
  }

  return (
    <>
      <div className={clsx("absolute inset-0 pointer-events-none", className)}>
        {Object.values(godsAlive).map(god => {
          const now = Date.now()
          const isOnCooldown = now < god.cooldownUntil

          return (
            <div
              key={god.id}
              className={clsx(
                "absolute pointer-events-auto cursor-pointer transition-all duration-300",
                isOnCooldown ? "opacity-50 cursor-not-allowed" : "opacity-100 hover:scale-110"
              )}
              style={{
                left: god.x - 20,
                top: god.y - 20,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => !isOnCooldown && handleGodClick(e, god.id, god.x, god.y)}
            >
              {/* God icon */}
              <div className="w-10 h-10">
                <img 
                  src={GodClusterSVG} 
                  alt={`${god.domain} god`}
                  className={clsx(
                    "w-full h-full transition-colors",
                    domainColors[god.domain]
                  )}
                />
              </div>
              
              {/* Domain indicator */}
              <div className={clsx(
                "absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-mono",
                domainColors[god.domain]
              )}>
                {god.domain}
              </div>
              
              {/* Cooldown indicator */}
              {isOnCooldown && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-xs font-mono">
                    {Math.ceil((god.cooldownUntil - now) / 1000)}s
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bargain Wheel */}
      {bargainWheel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4"
            style={{
              position: 'absolute',
              left: Math.min(bargainWheel.x, window.innerWidth - 400),
              top: Math.min(bargainWheel.y, window.innerHeight - 300)
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-gray-300">God's Bargain</h3>
              <button
                onClick={handleBargainClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-400 font-mono mb-4">
              Choose a boon. A price will be applied automatically.
            </p>
            
            <div className="space-y-3">
              {boonOptions.map((option, index) => (
                <button
                  key={option.boon}
                  onClick={() => handleBoonSelect(option.boon)}
                  className="w-full p-3 text-left border border-gray-600 rounded hover:border-gray-400 transition-colors"
                >
                  <div className="font-mono text-gray-300">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
