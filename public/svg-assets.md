# Vector Occultist SVG Assets

A collection of cosmic horror SVG assets for the Godseed garden, following the Vector Occultist aesthetic with gritty textures and primitive geometry.

## Palette

- **Deep Black**: `#0b0b0f` - Base background
- **Rot Green**: `#5fa56b` - Organic growth, roots
- **Sick Gold**: `#c2a35e` - Metallic accents, borders
- **Bruise Violet**: `#5e3a7a` - Cosmic elements, shadows
- **Bone**: `#e9e6dc` - Text, highlights
- **Blood**: `#a31621` - Entropy, corruption

## Assets

### Core Elements
- **`sigil.svg`** - Main Godseed sigil with fractured halo and inner eye
- **`entropy-halo.svg`** - Animated entropy meter with progress ring
- **`ritual-button.svg`** - Occult button with bloom hover effects

### Backgrounds & Textures
- **`breathing-soil.svg`** - Animated soil texture with displacement
- **`root-divider.svg`** - Organic root network divider
- **`fungal-growth.svg`** - Mycelial network with branching patterns

### Text & UI
- **`rift-text.svg`** - Glitch-displaced text with animated noise
- **`rotten-border.svg`** - Decayed frame with rust textures

### Cosmic Elements
- **`cosmic-eye.svg`** - Pulsing cosmic eye with star field

## React Components

### Sigil
```tsx
import { Sigil } from './components/Sigil'

<Sigil className="w-32 h-32" stroke="#c2a35e" />
```

### EntropyHalo
```tsx
import { EntropyHalo } from './components/EntropyHalo'

<EntropyHalo entropy={65} className="w-48 h-48" />
```

### RitualButton
```tsx
import { RitualButton } from './components/RitualButton'

<RitualButton onClick={handleClick} disabled={false}>
  PLANT SEED
</RitualButton>
```

## Filter System

### Base Filters
- **`grain`** - Fractal noise overlay for texture
- **`rough`** - Edge displacement for organic feel
- **`bloom`** - Soft glow effects
- **`rift`** - Animated displacement for glitch effects

### Specialized Filters
- **`fungalRough`** - Organic displacement for mycelial growth
- **`cosmicBloom`** - Radial glow for cosmic elements
- **`rustMask`** - Decay textures with clamped alpha
- **`warmShadow`** - Warm-toned shadows for rot effects

## Animation Guidelines

### Motion Principles
- **Duration**: 6-12 seconds for breathing effects
- **Amplitude**: ≤1s displacement to avoid nausea
- **Easing**: Natural, organic curves
- **Reduced Motion**: All animations respect `prefers-reduced-motion`

### Animation Types
- **Breathing**: Subtle scale/frequency changes
- **Displacement**: Noise-driven position shifts
- **Bloom**: Pulsing glow effects
- **Rift**: Glitch-style text displacement

## Optimization

### SVGO Configuration
```javascript
// svgo.config.mjs
export default {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    'removeDimensions',
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
    { name: 'convertPathData', params: { floatPrecision: 2 } },
    { name: 'removeUnknownsAndDefaults', params: { keepDataAttrs: true } },
    'removeUselessStrokeAndFill',
    'removeUselessDefs',
    'removeXMLNS'
  ]
};
```

### Usage
```bash
npm i -D svgo
npx svgo -c svgo.config.mjs -f src/assets/svg/ -o src/assets/svg/
```

## Accessibility

### ARIA Support
- All SVGs include `<title>` and `<desc>` elements
- Role attributes for semantic meaning
- High contrast for UI elements
- Reduced motion support

### Color Contrast
- Text elements meet WCAG AA standards
- UI elements have sufficient contrast ratios
- Alternative text for decorative elements

## Integration

### CSS Integration
```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  svg animate { 
    display: none !important; 
  }
}
```

### React Integration
```tsx
// Dynamic entropy updates
<EntropyHalo entropy={gameState.entropy} />

// Interactive buttons
<RitualButton onClick={handlePlantSeed}>
  {isPlanting ? 'PLANTING...' : 'PLANT SEED'}
</RitualButton>
```

## Variants

### Fungal Theme
- Increase `feTurbulence` numOctaves to 4
- Add branching path curls with green strokes
- Overlay grain at 0.18 alpha

### Cosmic Theme
- Add radial gradient cores
- Apply bloom filters
- Subtle displacement of star dots

### Rotten Theme
- Warm shadows with multiply blend
- Rust mask over strokes
- Jagged alpha clamping

## Performance

### Optimization Tips
- Reuse filter definitions via `id`
- Collapse unnecessary groups
- Avoid excessive decimal precision
- Use `viewBox` instead of fixed dimensions
- Minimize path complexity

### File Sizes
- Core assets: 2-5KB each
- Animated assets: 3-8KB each
- Optimized with SVGO: 30-50% reduction

## License

All assets are original creations following the Vector Occultist aesthetic. Use freely within the Godseed project.
