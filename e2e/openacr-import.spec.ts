import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const sampleYaml = `
title: Sample VPAT
catalog: 2.4-edition-wcag-2.1-en
notes: Imported from test
chapters:
  success_criteria_level_a:
    criteria:
      - num: "1.1.1"
        components:
          - name: web
            adherence:
              level: supports
              notes: All images have descriptive alt text
      - num: "1.3.1"
        components:
          - name: web
            adherence:
              level: partially-supports
              notes: Some landmark regions missing
  success_criteria_level_aa:
    criteria:
      - num: "1.4.3"
        components:
          - name: web
            adherence:
              level: does-not-support
              notes: Multiple contrast failures found
`.trim();

test.describe('OpenACR YAML Import', () => {
  let projectId: string;

  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/projects', {
      data: { name: 'E2E OpenACR Import Project' },
    });
    expect(res.ok()).toBeTruthy();
    projectId = (await res.json()).data.id;
  });

  test.afterEach(async ({ request }) => {
    if (projectId) await request.delete(`/api/projects/${projectId}`);
  });

  test('creates a VPAT from an OpenACR YAML file', async ({ page }) => {
    const yamlPath = path.join(os.tmpdir(), 'test-openacr.yaml');
    fs.writeFileSync(yamlPath, sampleYaml);

    try {
      await page.goto('/vpats');

      // Open modal
      await page.getByRole('button', { name: /import from openacr/i }).click();

      const dialog = page.getByRole('dialog');

      // Step 1: select project
      await expect(dialog.getByRole('heading', { name: /select project/i })).toBeVisible();
      await dialog.locator('select').selectOption({ label: 'E2E OpenACR Import Project' });
      await dialog.getByRole('button', { name: /^next$/i }).click();

      // Step 2: upload file
      await expect(dialog.getByRole('heading', { name: /upload openacr yaml/i })).toBeVisible();
      await page.getByLabel(/yaml file/i).setInputFiles(yamlPath);
      await expect(dialog.getByText('Sample VPAT')).toBeVisible();
      await expect(dialog.getByText(/3 criteria/i)).toBeVisible();
      await dialog.getByRole('button', { name: /^next$/i }).click();

      // Step 3: confirm
      await expect(dialog.getByRole('heading', { name: /confirm import/i })).toBeVisible();
      await dialog.getByRole('button', { name: /^import$/i }).click();

      // Redirected to VPAT detail page
      await expect(page).toHaveURL(/\/vpats\//);
      await expect(page.getByRole('heading', { name: 'Sample VPAT' })).toBeVisible({
        timeout: 10000,
      });
    } finally {
      fs.unlinkSync(yamlPath);
    }
  });

  test('shows parse error for invalid YAML file', async ({ page }) => {
    const badPath = path.join(os.tmpdir(), 'bad.yaml');
    fs.writeFileSync(badPath, 'not: valid: {{{');

    try {
      await page.goto('/vpats');
      await page.getByRole('button', { name: /import from openacr/i }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: /select project/i })).toBeVisible();
      await dialog.locator('select').selectOption({ label: 'E2E OpenACR Import Project' });
      await dialog.getByRole('button', { name: /^next$/i }).click();

      await page.getByLabel(/yaml file/i).setInputFiles(badPath);

      await expect(dialog.getByText(/could not parse yaml/i)).toBeVisible();
    } finally {
      fs.unlinkSync(badPath);
    }
  });
});
