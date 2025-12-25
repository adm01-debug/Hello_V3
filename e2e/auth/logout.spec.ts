import { test, expect } from '@playwright/test'
test('logout', async ({ page }) => {
  await page.goto('/logout')
  await expect(page).toHaveURL('/login')
})
