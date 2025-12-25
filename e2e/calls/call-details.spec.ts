import { test, expect } from '@playwright/test'
test('call details', async ({ page }) => {
  await page.goto('/calls/123')
  expect(page).toBeTruthy()
})
