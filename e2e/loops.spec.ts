import { test, expect } from '@playwright/test'

test.describe('Loop Metadata System', () => {
  test('should load loop metadata on startup', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Check that loop metadata is loaded (via console logs)
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('Loop metadata loaded')) {
        logs.push(msg.text())
      }
    })
    
    // Trigger audio system initialization
    const clickSurface = page.locator('[data-testid="click-surface"]')
    await clickSurface.click()
    
    // Wait a bit for initialization
    await page.waitForTimeout(1000)
    
    // Check that loop metadata was loaded
    expect(logs.length).toBeGreaterThan(0)
  })

  test('should display loop metadata in debug panel', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Enable debug panel
    const debugButton = page.locator('button:has-text("DEBUG: OFF")')
    await debugButton.click()
    
    // Check that debug panel is visible
    await expect(page.locator('text=Audio Debug')).toBeVisible()
    
    // Check that loop metadata is displayed
    await expect(page.locator('text=Loop Metadata:')).toBeVisible()
    
    // Check for specific metadata entries
    const metadataEntries = page.locator('[class*="border-l-2"]')
    await expect(metadataEntries).toHaveCount(6) // 6 audio files
  })

  test('should show active loops in debug panel', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Enable debug panel
    const debugButton = page.locator('button:has-text("DEBUG: OFF")')
    await debugButton.click()
    
    // Rapidly click to trigger ambient loops
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    for (let i = 0; i < 10; i++) {
      await clickSurface.click()
      await page.waitForTimeout(100)
    }
    
    // Check that active loops are displayed
    await expect(page.locator('text=Active Loops:')).toBeVisible()
    
    // Should show at least one active loop
    const activeLoops = page.locator('text=amb.drone.low, text=amb.drone.mid, text=amb.hiss.static')
    await expect(activeLoops.first()).toBeVisible()
  })

  test('should handle loop metadata fallbacks', async ({ page }) => {
    // Mock missing loop metadata
    await page.route('**/dist/loop_meta.json', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: '{}'
      })
    })
    
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Check that fallback metadata is used
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('Loop metadata not found')) {
        logs.push(msg.text())
      }
    })
    
    // Trigger audio system
    const clickSurface = page.locator('[data-testid="click-surface"]')
    await clickSurface.click()
    
    await page.waitForTimeout(1000)
    
    // Should have logged fallback message
    expect(logs.length).toBeGreaterThan(0)
  })

  test('should apply loop points to ambient cues', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Enable debug panel
    const debugButton = page.locator('button:has-text("DEBUG: OFF")')
    await debugButton.click()
    
    // Rapidly click to trigger entropy thresholds
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    for (let i = 0; i < 15; i++) {
      await clickSurface.click()
      await page.waitForTimeout(50)
    }
    
    // Check that loop metadata attributes are set
    await expect(page.locator('body')).toHaveAttribute('data-audio-active')
    
    // Check for loop metadata attributes
    const hasLoopStart = await page.locator('body').getAttribute('data-loop-start')
    const hasLoopEnd = await page.locator('body').getAttribute('data-loop-end')
    const hasCrossfade = await page.locator('body').getAttribute('data-crossfade-ms')
    
    expect(hasLoopStart).toBeTruthy()
    expect(hasLoopEnd).toBeTruthy()
    expect(hasCrossfade).toBeTruthy()
  })
})
