import React from 'react'

interface SigilProps {
  className?: string
  stroke?: string
  fill?: string
}

export function Sigil({ className, stroke = "#c2a35e", fill = "none" }: SigilProps) {
  return (
    <svg viewBox="0 0 600 600" className={className} role="img" aria-labelledby="t d">
      <title id="t">Godseed Sigil</title>
      <desc id="d">A fractured circular sigil with roots and an inner eye, textured with cosmic grain.</desc>

      <defs>
        <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="7" result="n"/>
          <feColorMatrix in="n" type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18"/>
          </feComponentTransfer>
        </filter>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="9" result="t"/>
          <feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="bloom">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feBlend in="SourceGraphic" in2="b" mode="screen"/>
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="#0b0b0f"/>
      <g filter="url(#rough)" stroke={stroke} fill={fill} strokeWidth="3">
        <path d="M300,120 a180,180 0 1,1 -0.1,0" opacity="0.75"/>
        <path d="M140,300 L220,300" />
        <path d="M380,300 L460,300" />
        <path d="M300,140 L300,220" />
        <path d="M300,380 L300,460" />
      </g>
      <g filter="url(#bloom)">
        <ellipse cx="300" cy="300" rx="96" ry="60" fill="none" stroke="#e9e6dc" strokeWidth="2"/>
        <circle cx="300" cy="300" r="18" fill="#e9e6dc"/>
        <path d="M300,320 C280,360 260,390 240,420
                 M300,320 C320,360 340,390 360,420"
              stroke="#5fa56b" strokeWidth="2" fill="none"/>
      </g>
      <rect width="100%" height="100%" style={{mixBlendMode: 'overlay'}} filter="url(#grain)"/>
    </svg>
  )
}
