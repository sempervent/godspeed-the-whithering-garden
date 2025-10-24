import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock the story engine
vi.mock('../lib/storyEngine', () => ({
  useStory: () => ({
    loadStory: vi.fn().mockResolvedValue({
      title: 'Test Story',
      author: 'Test Author',
      lines: [
        { text: 'First line' },
        { text: 'Second line', flags: { seed: true } },
        { text: 'Third line' },
      ],
    }),
    nextLine: vi.fn((index) => {
      const lines = [
        { text: 'First line' },
        { text: 'Second line', flags: { seed: true } },
        { text: 'Third line' },
      ]
      return lines[index] || { text: 'End of story' }
    }),
    applyEntropy: vi.fn((text) => text),
  }),
}))

describe('App', () => {
  it('renders the main interface', () => {
    render(<App />)
    
    expect(screen.getByText('Garden Status')).toBeInTheDocument()
    expect(screen.getByText('Garden Log')).toBeInTheDocument()
    expect(screen.getByText('Click to tend the garden')).toBeInTheDocument()
  })

  it('advances story on click', async () => {
    render(<App />)
    
    const clickSurface = screen.getByRole('button', { name: /click to advance the story/i })
    
    // Click three times
    fireEvent.click(clickSurface)
    fireEvent.click(clickSurface)
    fireEvent.click(clickSurface)
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Progress counter
    })
  })

  it('updates HUD counters', async () => {
    render(<App />)
    
    const clickSurface = screen.getByRole('button', { name: /click to advance the story/i })
    
    // Click to trigger seed flag
    fireEvent.click(clickSurface)
    fireEvent.click(clickSurface)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Seeds counter
    })
  })

  it('responds to keyboard input', async () => {
    render(<App />)
    
    // Press space key
    fireEvent.keyDown(document, { code: 'Space' })
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Progress counter
    })
  })
})
