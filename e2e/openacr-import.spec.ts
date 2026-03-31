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
      await page.goto('/vpats/new');

      // Step 1: select "Import from OpenACR" edition
      await page.getByRole('radio', { name: /import from openacr/i }).click();
      await page.getByRole('button', { name: /^next$/i }).click();

      // Step 2: upload YAML file
      await expect(page.getByText(/upload openacr/i)).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(yamlPath);
      await expect(page.getByText('Sample VPAT')).toBeVisible();
      await expect(page.getByText(/3 criteria/i)).toBeVisible();
      await page.getByRole('button', { name: /^next$/i }).click();

      // Step 3: select project and import
      await expect(page.getByText(/select project/i)).toBeVisible();
      await page.locator('select#import-project').selectOption({ value: projectId });
      const importBtn = page.getByRole('button', { name: /^import$/i });
      await expect(importBtn).toBeEnabled();

      // Start waiting for URL change before clicking to avoid missing the navigation event
      await Promise.all([
        page.waitForURL(
          (url) => url.pathname.startsWith('/vpats/') && url.pathname !== '/vpats/new',
          { timeout: 10000 }
        ),
        importBtn.click(),
      ]);

      await expect(page.getByRole('heading', { name: 'Sample VPAT' })).toBeVisible();
    } finally {
      fs.unlinkSync(yamlPath);
    }
  });

  test('shows parse error for invalid YAML file', async ({ page }) => {
    const badPath = path.join(os.tmpdir(), 'bad.yaml');
    fs.writeFileSync(badPath, 'not: valid: {{{');

    try {
      await page.goto('/vpats/new');

      // Step 1: select "Import from OpenACR" edition
      await page.getByRole('radio', { name: /import from openacr/i }).click();
      await page.getByRole('button', { name: /^next$/i }).click();

      // Step 2: upload invalid YAML file
      await expect(page.getByText(/upload openacr/i)).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(badPath);

      await expect(page.getByText(/could not parse yaml/i)).toBeVisible();
    } finally {
      fs.unlinkSync(badPath);
    }
  });
});
