import { test, expect } from '@playwright/test'
test('signup', async ({ page }) => {
  await page.goto('/signup')
  expect(page).toBeTruthy()
})
