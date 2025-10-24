# Architecture Overview

## System Design

Godseed: The Withering Garden is a client-side narrative game built with modern web technologies. The architecture is designed for simplicity, performance, and maintainability.

## Core Technologies

- **React 18** - UI framework with hooks and functional components
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Vitest** - Testing framework

## Architecture Layers

### 1. Presentation Layer
- **Components**: React components for UI
- **Styling**: Tailwind CSS with custom animations
- **Accessibility**: Keyboard navigation and screen reader support

### 2. State Management
- **Zustand Store**: Centralized state management
- **Game State**: Line index, seeds, awakened count, entropy
- **History**: Story progression tracking

### 3. Business Logic
- **Story Engine**: Narrative progression and entropy effects
- **Game Logic**: Click handling, counter updates, entropy decay
- **Content Management**: Story loading and fallback handling

### 4. Data Layer
- **Story JSON**: Narrative content structure
- **Fallback Data**: Hardcoded story for offline use
- **Local Storage**: Optional persistence (future enhancement)

## Component Architecture

```
App
├── HUD (Game Status)
├── ClickSurface (Main Interaction)
└── LogPane (Story History)
```

### Key Components

#### ClickSurface
- Main interaction area
- Handles click and keyboard events
- Manages entropy visual effects
- Responsive design for mobile/desktop

#### HUD (Heads-Up Display)
- Game status indicators
- Seeds, Awakened, Entropy counters
- Progress visualization
- Status messages

#### LogPane
- Story history display
- Typewriter effects
- Entropy-based text corruption
- Auto-scrolling behavior

## State Management

### Zustand Store Structure

```typescript
interface GameState {
  lineIndex: number      // Current story position
  seeds: number         // Seed counter
  awakened: number      // Awakening milestones
  entropy: number       // Chaos level (0-100)
  history: string[]     // Story progression
  isPlaying: boolean    // Game state
}
```

### State Updates

- **advanceStory()**: Increment line index
- **incrementSeed()**: Add seed on flag
- **incrementAwakened()**: Add awakening milestone
- **updateEntropy()**: Modify chaos level
- **addToHistory()**: Record story line

## Story Engine

### Core Features

- **Story Loading**: JSON content with fallback
- **Line Progression**: Sequential story advancement
- **Entropy Effects**: Visual corruption based on chaos
- **Flag System**: Special story events (seeds, awakenings)

### Entropy System

- **Rising**: Fast clicking increases entropy
- **Decay**: Natural entropy reduction over time
- **Effects**: Visual corruption and text scrambling
- **Thresholds**: Different effects at 30, 60, 90 entropy

## Performance Considerations

### Optimization Strategies

- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Stable function references
- **useEffect**: Proper dependency arrays
- **Lazy Loading**: Future story content loading

### Bundle Size

- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Route-based splitting (future)
- **Asset Optimization**: Image and font optimization

## Testing Strategy

### Test Types

- **Unit Tests**: Component and utility functions
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows (future)

### Test Coverage

- **Components**: Rendering and user interactions
- **Store**: State management logic
- **Story Engine**: Narrative progression
- **Accessibility**: Keyboard and screen reader support

## Deployment Architecture

### Build Process

1. **Development**: Vite dev server with HMR
2. **Production**: Vite build with optimization
3. **Static Export**: Self-contained HTML/CSS/JS
4. **Docker**: Nginx serving static files

### Deployment Options

- **GitHub Pages**: Static hosting
- **Docker**: Containerized deployment
- **CDN**: Global content delivery (future)

## Security Considerations

### Client-Side Security

- **No Server Dependencies**: Pure client-side application
- **Content Security Policy**: XSS protection
- **Input Validation**: User interaction safety
- **Dependency Auditing**: Regular security updates

### Data Privacy

- **Local Storage Only**: No external data transmission
- **No Tracking**: Privacy-focused design
- **Offline Capable**: No network dependencies

## Future Enhancements

### Planned Features

- **Save System**: Local storage persistence
- **Multiple Stories**: Story selection interface
- **Audio**: Ambient sound effects
- **Visual Effects**: Enhanced entropy animations
- **Mobile App**: React Native version

### Technical Improvements

- **PWA Support**: Offline functionality
- **Performance Monitoring**: Real-time metrics
- **A/B Testing**: Story variant testing
- **Analytics**: Usage insights (privacy-focused)

## Development Workflow

### Code Quality

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **TypeScript**: Type safety

### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Multi-Environment**: Development, staging, production
- **Automated Testing**: Unit, integration, and E2E tests
- **Security Scanning**: Dependency vulnerability checks
