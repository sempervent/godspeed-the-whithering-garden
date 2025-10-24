import { test, expect } from '@playwright/test'

test.describe('Atmosphere System', () => {
  test('should trigger visual effects on entropy thresholds', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Rapidly click to increase entropy
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    // Click rapidly to push entropy over 60
    for (let i = 0; i < 10; i++) {
      await clickSurface.click()
      await page.waitForTimeout(50) // Small delay between clicks
    }
    
    // Check for flicker effect
    await expect(page.locator('body')).toHaveClass(/fx--flicker/)
  })

  test('should trigger audio cues on story flags', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Click until we get a seed flag (this might take several clicks)
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    // Click until we get a seed flag
    let foundSeed = false
    for (let i = 0; i < 20 && !foundSeed; i++) {
      await clickSurface.click()
      await page.waitForTimeout(100)
      
      // Check if we have a seed flag in the log
      const logEntries = page.locator('[data-testid="log-entry"]')
      const count = await logEntries.count()
      
      if (count > 0) {
        const lastEntry = logEntries.nth(count - 1)
        const text = await lastEntry.textContent()
        if (text?.includes('seed') || text?.includes('root')) {
          foundSeed = true
        }
      }
    }
    
    // Check for audio cue
    await expect(page.locator('body')).toHaveAttribute('data-audio-fired', 'sfx.chime.glass')
  })

  test('should handle choice UI with ducking', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Click until we get to a choice point
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    // Click until we get choices (this might take several clicks)
    let foundChoices = false
    for (let i = 0; i < 20 && !foundChoices; i++) {
      await clickSurface.click()
      await page.waitForTimeout(100)
      
      // Check if we have choice buttons
      const choiceButtons = page.locator('button[data-domain]')
      if (await choiceButtons.count() > 0) {
        foundChoices = true
        
        // Check for ducking effect
        await expect(page.locator('body')).toHaveAttribute('data-ducking', 'true')
        
        // Check for bloom pulse effect
        await expect(page.locator('body')).toHaveClass(/fx--bloom-pulse/)
      }
    }
  })

  test('should handle corruption text with tags', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Rapidly click to increase entropy and trigger corruption
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    // Click rapidly to push entropy high
    for (let i = 0; i < 15; i++) {
      await clickSurface.click()
      await page.waitForTimeout(30) // Very fast clicks
    }
    
    // Check for corruption effects
    const logEntries = page.locator('[data-testid="log-entry"]')
    const count = await logEntries.count()
    
    if (count > 0) {
      const lastEntry = logEntries.nth(count - 1)
      
      // Check for text rift effect
      await expect(lastEntry).toHaveClass(/fx--text-rift/)
    }
  })

  test('should respect accessibility settings', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Toggle reduce motion
    const reduceMotionButton = page.locator('button:has-text("REDUCE MOTION")')
    await reduceMotionButton.click()
    
    // Rapidly click to increase entropy
    const clickSurface = page.locator('[data-testid="click-surface"]')
    
    for (let i = 0; i < 10; i++) {
      await clickSurface.click()
      await page.waitForTimeout(50)
    }
    
    // Check that intense effects are not applied when reduce motion is on
    await expect(page.locator('body')).not.toHaveClass(/fx--intense-flicker/)
  })

  test('should handle mute toggle', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="click-surface"]')
    
    // Toggle mute
    const muteButton = page.locator('button:has-text("MUTED")')
    await muteButton.click()
    
    // Click to trigger audio cues
    const clickSurface = page.locator('[data-testid="click-surface"]')
    await clickSurface.click()
    
    // Check that audio cues are not fired when muted
    await expect(page.locator('body')).not.toHaveAttribute('data-audio-fired')
  })
})
