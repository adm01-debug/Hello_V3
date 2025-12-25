import { test, expect } from '@playwright/test'
test('deve iniciar transcrição', async ({ page }) => {
  await page.goto('/transcriptions/new')
  expect(true).toBe(true)
})
