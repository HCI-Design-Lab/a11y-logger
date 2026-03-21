import { test, expect } from '@playwright/test';

test('redirects root to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('sidebar navigation is present and accessible', async ({ page }) => {
  await page.goto('/dashboard');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Projects' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'VPATs' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Settings' })).toBeVisible();
});

test('theme toggle button is present', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible();
});

test('clicking Projects link navigates to /projects', async ({ page }) => {
  await page.goto('/dashboard');
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects' })
    .click();
  await page.waitForURL(/\/projects/);
});
