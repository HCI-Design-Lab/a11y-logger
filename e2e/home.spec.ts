import { test, expect } from '@playwright/test';

test('home page has A11y Logger title and redirects to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/A11y Logger/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
