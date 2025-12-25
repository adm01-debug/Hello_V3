import { test, expect } from '@playwright/test'
test('list calls', async ({ page }) => {
  await page.goto('/calls')
  expect(page).toBeTruthy()
})
