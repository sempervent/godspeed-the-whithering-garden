import React, { useEffect, useRef } from 'react'

interface EntropyHaloProps {
  entropy: number
  className?: string
}

export function EntropyHalo({ entropy, className }: EntropyHaloProps) {
  const arcRef = useRef<SVGCircleElement>(null)
  const textRef = useRef<SVGTextElement>(null)

  useEffect(() => {
    if (arcRef.current) {
      const offset = 100 - entropy
      arcRef.current.style.strokeDashoffset = offset.toString()
    }
    if (textRef.current) {
      textRef.current.textContent = `ENTROPY ${Math.round(entropy)}`
    }
  }, [entropy])

  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-labelledby="te de">
      <title id="te">Entropy Halo</title>
      <desc id="de">A ring meter with grain and inner glow for entropy.</desc>
      <defs>
        <linearGradient id="entGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#5fa56b"/>
          <stop offset="1" stopColor="#a31621"/>
        </linearGradient>
        <filter id="grainSmall">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="5" result="g"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer>
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="#0b0b0f"/>
      <circle cx="120" cy="120" r="92" stroke="#1a1420" strokeWidth="18" fill="none"/>
      <circle 
        ref={arcRef}
        cx="120" 
        cy="120" 
        r="92" 
        stroke="url(#entGrad)" 
        strokeWidth="14" 
        fill="none"
        strokeLinecap="round" 
        pathLength="100" 
        strokeDasharray="100" 
        style={{ strokeDashoffset: 100 - entropy }}
      />
      <circle cx="120" cy="120" r="60" fill="#1a1420" filter="url(#grainSmall)"/>
      <text 
        ref={textRef}
        x="120" 
        y="127" 
        textAnchor="middle" 
        fontSize="18" 
        fill="#e9e6dc" 
        fontFamily="ui-monospace,monospace"
      >
        ENTROPY {Math.round(entropy)}
      </text>
    </svg>
  )
}
