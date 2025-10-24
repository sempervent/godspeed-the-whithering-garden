import React from 'react'

interface RitualButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function RitualButton({ children, onClick, className, disabled }: RitualButtonProps) {
  return (
    <svg viewBox="0 0 220 64" className={className} role="button" aria-labelledby="tb db">
      <title id="tb">Ritual Button</title>
      <desc id="db">A pill button with inner sigil bloom hover state.</desc>
      <defs>
        <filter id="roughEdge">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="12" result="t"/>
          <feDisplacementMap in="SourceGraphic" in2="t" scale="3"/>
        </filter>
        <filter id="bloomSoft">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feBlend in="SourceGraphic" in2="b" mode="screen"/>
        </filter>
      </defs>

      <g filter="url(#roughEdge)">
        <rect 
          x="4" 
          y="4" 
          rx="28" 
          ry="28" 
          width="212" 
          height="56" 
          fill="#1a1420" 
          stroke="#c2a35e"
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
          onClick={disabled ? undefined : onClick}
        />
        <g filter="url(#bloomSoft)">
          <text 
            x="110" 
            y="38" 
            textAnchor="middle" 
            fontFamily="ui-sans-serif,system-ui" 
            fontSize="16" 
            fill="#e9e6dc" 
            letterSpacing="2"
          >
            {children}
          </text>
          <circle cx="24" cy="32" r="8" fill="none" stroke="#5fa56b" strokeWidth="2"/>
          <path d="M24,24 L24,40 M20,32 L28,32" stroke="#5fa56b" strokeWidth="2"/>
        </g>
      </g>
    </svg>
  )
}
