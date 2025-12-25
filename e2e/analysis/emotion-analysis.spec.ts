import { test, expect } from '@playwright/test'
test('emotion analysis', async ({ page }) => {
  await page.goto('/analysis/emotions')
  expect(page).toBeTruthy()
})
