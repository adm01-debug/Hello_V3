import { test, expect } from '@playwright/test'
test('sentiment analysis', async ({ page }) => {
  await page.goto('/analysis')
  expect(page).toBeTruthy()
})
