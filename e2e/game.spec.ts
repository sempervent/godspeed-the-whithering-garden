import { test, expect } from '@playwright/test'

test.describe('Godseed Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the game interface', async ({ page }) => {
    // Check that all main components are present
    await expect(page.locator('text=Garden Status')).toBeVisible()
    await expect(page.locator('text=Garden Log')).toBeVisible()
    await expect(page.locator('text=Click to tend the garden')).toBeVisible()
  })

  test('should advance story on click', async ({ page }) => {
    // Click the center area to advance story
    await page.click('[role="button"]')
    
    // Check that history has entries
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(1)
    
    // Click a few more times
    await page.click('[role="button"]')
    await page.click('[role="button"]')
    await page.click('[role="button"]')
    
    // Should have multiple entries
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(4)
  })

  test('should update counters on seed flags', async ({ page }) => {
    // Click until we get a seed
    for (let i = 0; i < 10; i++) {
      await page.click('[role="button"]')
      const seeds = await page.locator('text=Seeds').locator('..').locator('span').nth(1).textContent()
      if (seeds && parseInt(seeds) > 0) break
    }
    
    // Check that seeds counter is visible and > 0
    await expect(page.locator('text=Seeds').locator('..').locator('span').nth(1)).not.toHaveText('0')
  })

  test('should show choices when available', async ({ page }) => {
    // Click until we reach a choice point
    for (let i = 0; i < 10; i++) {
      await page.click('[role="button']')
      const hasChoices = await page.locator('text=Four doors open under the loam').isVisible()
      if (hasChoices) break
    }
    
    // Should show choice buttons
    await expect(page.locator('text=Feed the FLESH')).toBeVisible()
    await expect(page.locator('text=Trust the STONE')).toBeVisible()
    await expect(page.locator('text=Scatter to ASH')).toBeVisible()
    await expect(page.locator('text=Sleep in DREAM')).toBeVisible()
  })

  test('should handle choice selection', async ({ page }) => {
    // Navigate to choice point
    for (let i = 0; i < 10; i++) {
      await page.click('[role="button"]')
      const hasChoices = await page.locator('text=Four doors open under the loam').isVisible()
      if (hasChoices) break
    }
    
    // Select a choice
    await page.click('text=Feed the FLESH')
    
    // Should advance to the chosen path
    await expect(page.locator('text=The garden wants your pulse')).toBeVisible()
  })

  test('should increase entropy with rapid clicking', async ({ page }) => {
    // Click rapidly
    for (let i = 0; i < 10; i++) {
      await page.click('[role="button"]')
      await page.waitForTimeout(50) // Small delay to ensure rapid clicking
    }
    
    // Check that entropy has increased
    const entropyText = await page.locator('text=Entropy').locator('..').locator('span').nth(1).textContent()
    expect(entropyText).not.toBe('0')
  })

  test('should show entropy effects at high levels', async ({ page }) => {
    // Click rapidly to build entropy
    for (let i = 0; i < 20; i++) {
      await page.click('[role="button"]')
      await page.waitForTimeout(30)
    }
    
    // Should show entropy warning
    await expect(page.locator('text=The garden trembles')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Use space key to advance
    await page.keyboard.press('Space')
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(1)
    
    // Use enter key to advance
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(2)
  })

  test('should show domain alignments', async ({ page }) => {
    // Make some choices to build alignments
    for (let i = 0; i < 10; i++) {
      await page.click('[role="button"]')
      const hasChoices = await page.locator('text=Four doors open under the loam').isVisible()
      if (hasChoices) {
        await page.click('text=Feed the FLESH')
        break
      }
    }
    
    // Should show domain alignments
    await expect(page.locator('text=Alignments')).toBeVisible()
    await expect(page.locator('text=FLESH')).toBeVisible()
  })

  test('should handle save/load functionality', async ({ page }) => {
    // Advance story a bit
    await page.click('[role="button"]')
    await page.click('[role="button"]')
    
    // Save the game
    await page.click('text=Save')
    
    // Reset and load
    await page.reload()
    await page.click('text=A') // Load slot A
    
    // Should have the saved state
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(2)
  })

  test('should handle export/import saves', async ({ page }) => {
    // Advance story
    await page.click('[role="button"]')
    await page.click('[role="button"]')
    
    // Export save
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export Save')
    const download = await downloadPromise
    
    // Should have downloaded a JSON file
    expect(download.suggestedFilename()).toMatch(/godseed-save-.*\.json/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should show mobile overlay
    await expect(page.locator('text=Tap to advance')).toBeVisible()
  })

  test('should respect reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Should not have glitch animations
    const glitchElements = await page.locator('.animate-glitch').count()
    expect(glitchElements).toBe(0)
  })
})
