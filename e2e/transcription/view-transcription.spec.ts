import { test, expect } from '@playwright/test'
test('view transcription', async ({ page }) => {
  await page.goto('/transcriptions/123')
  expect(page).toBeTruthy()
})
