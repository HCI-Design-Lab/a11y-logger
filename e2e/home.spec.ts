import { test, expect } from '@playwright/test';

test('home page loads with A11y Logger heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A11y Logger' })).toBeVisible();
});
