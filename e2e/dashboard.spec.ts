import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should navigate to calls page', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Chamadas')
    await expect(page).toHaveURL(/.*calls/)
  })
})

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })
})
