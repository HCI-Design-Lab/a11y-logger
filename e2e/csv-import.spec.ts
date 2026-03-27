import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('CSV Import', () => {
  let projectId: string;
  let assessmentId: string;

  test.beforeEach(async ({ request }) => {
    // Create a project via API
    const projectRes = await request.post('/api/projects', {
      data: { name: 'E2E CSV Import Project' },
    });
    expect(projectRes.ok()).toBeTruthy();
    const projectData = await projectRes.json();
    projectId = projectData.data.id;

    // Create an assessment via API
    const assessmentRes = await request.post(`/api/projects/${projectId}/assessments`, {
      data: { name: 'E2E CSV Import Assessment' },
    });
    expect(assessmentRes.ok()).toBeTruthy();
    const assessmentData = await assessmentRes.json();
    assessmentId = assessmentData.data.id;
  });

  test.afterEach(async ({ request }) => {
    // Clean up: delete project (cascades to assessments and issues)
    if (projectId) {
      await request.delete(`/api/projects/${projectId}`);
    }
  });

  test('imports issues from CSV into an assessment', async ({ page }) => {
    // Create a temp CSV file with headers that auto-match importable fields
    const csvContent =
      'title,description,severity\nMissing alt text,Images lack alt,critical\nLow contrast,Text fails AA,high';
    const csvPath = path.join(os.tmpdir(), 'test-import.csv');
    fs.writeFileSync(csvPath, csvContent);

    try {
      // Navigate to the assessment page
      await page.goto(`/projects/${projectId}/assessments/${assessmentId}`);
      await expect(page.getByRole('heading', { name: 'E2E CSV Import Assessment' })).toBeVisible();

      // Open settings menu and click Import Issues
      await page.getByRole('button', { name: /assessment settings/i }).click();
      await page.getByRole('menuitem', { name: /import issues/i }).click();

      // Step 1: Upload file — dialog should show "Upload CSV"
      await expect(page.getByRole('heading', { name: /upload csv/i })).toBeVisible();
      const dialog = page.getByRole('dialog');
      await page.getByLabel(/csv file/i).setInputFiles(csvPath);

      // Preview should appear after parsing
      await expect(page.getByText(/preview/i)).toBeVisible();

      // Advance to column mapping step
      await dialog.getByRole('button', { name: 'Next', exact: true }).click();

      // Step 2: Map Columns dialog
      await expect(page.getByRole('heading', { name: /map columns/i })).toBeVisible();

      // Confirm import
      await dialog.getByRole('button', { name: /import 2 rows/i }).click();

      // Dialog should close and issues should appear in the list
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText('Missing alt text')).toBeVisible();
      await expect(page.getByText('Low contrast')).toBeVisible();
    } finally {
      fs.unlinkSync(csvPath);
    }
  });

  test('creates issues with fallback title when title column is not mapped', async ({ page }) => {
    const csvContent = 'desc\nNo title here';
    const csvPath = path.join(os.tmpdir(), 'no-title.csv');
    fs.writeFileSync(csvPath, csvContent);

    try {
      await page.goto(`/projects/${projectId}/assessments/${assessmentId}`);
      await expect(page.getByRole('heading', { name: 'E2E CSV Import Assessment' })).toBeVisible();

      await page.getByRole('button', { name: /assessment settings/i }).click();
      await page.getByRole('menuitem', { name: /import issues/i }).click();
      await expect(page.getByRole('heading', { name: /upload csv/i })).toBeVisible();

      const dialog = page.getByRole('dialog');
      await page.getByLabel(/csv file/i).setInputFiles(csvPath);
      await expect(page.getByText(/preview/i)).toBeVisible();

      await dialog.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByRole('heading', { name: /map columns/i })).toBeVisible();

      // Import without mapping the title column
      await dialog.getByRole('button', { name: /import 1 row/i }).click();

      // Dialog should close and issue created with "Untitled" fallback
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText('Untitled')).toBeVisible();
    } finally {
      fs.unlinkSync(csvPath);
    }
  });
});
