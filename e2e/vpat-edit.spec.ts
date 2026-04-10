import { test, expect } from '@playwright/test';

/**
 * E2E tests for VPAT edit page — remarks persistence and AI generation.
 *
 * Each test creates its own project + VPAT via the API and cleans up after itself.
 */

let projectId: string;
let vpatId: string;

test.beforeEach(async ({ request }) => {
  // Create project
  const projectRes = await request.post('/api/projects', {
    data: { name: 'E2E VPAT Edit Project' },
  });
  expect(projectRes.ok()).toBeTruthy();
  projectId = (await projectRes.json()).data.id;

  // Create WCAG VPAT
  const vpatRes = await request.post('/api/vpats', {
    data: {
      title: 'E2E VPAT Edit',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    },
  });
  expect(vpatRes.ok()).toBeTruthy();
  vpatId = (await vpatRes.json()).data.id;
});

test.afterEach(async ({ request }) => {
  if (projectId) await request.delete(`/api/projects/${projectId}`);
});

test('typing remarks and saving persists to view and edit pages', async ({ page }) => {
  await page.goto(`/vpats/${vpatId}/edit`);
  await expect(page.getByRole('heading', { name: 'E2E VPAT Edit' })).toBeVisible();

  // Click Level A tab (exact: true avoids matching Level AA / Level AAA)
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  // Find the remarks textarea for criterion 1.1.1 (Non-text Content)
  const textarea = page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i });
  await expect(textarea).toBeVisible();

  // Type into it and wait for the 500ms debounce to flush
  await textarea.fill('Test');
  await page.waitForTimeout(600);

  // Click "Save VPAT" and wait for the PATCH request to complete
  const patchDone = page.waitForResponse(
    (resp) => resp.url().includes('/rows/') && resp.request().method() === 'PATCH'
  );
  await page.getByRole('button', { name: /Save VPAT/i }).click();
  await patchDone;

  // Should navigate to the read-only view page
  await expect(page).toHaveURL(new RegExp(`/vpats/${vpatId}$`), { timeout: 10000 });

  // Open Level A tab on the view page — it defaults to cover-sheet
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  // Remarks should appear on the read-only view
  await expect(page.getByText('Test')).toBeVisible();

  // Go back to edit and verify the remarks are still there
  await page.goto(`/vpats/${vpatId}/edit`);
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  const editTextarea = page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i });
  await expect(editTextarea).toHaveValue('Test');
});

test('AI generation updates the textarea with generated remarks', async ({ page, request }) => {
  // Fetch the VPAT data to get the actual row IDs
  const vpatRes = await request.get(`/api/vpats/${vpatId}`);
  const vpatData = (await vpatRes.json()).data;
  const row111 = vpatData.criterion_rows.find(
    (r: { criterion_code: string }) => r.criterion_code === '1.1.1'
  );
  expect(row111).toBeTruthy();

  const generatedRemarks = 'AI generated: Images must have descriptive alt text.';

  // Intercept the generate API and return a mock response
  await page.route(`/api/vpats/${vpatId}/rows/${row111.id}/generate`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          ...row111,
          remarks: generatedRemarks,
          ai_confidence: 'high',
          ai_reasoning: 'Based on the issues found.',
          ai_suggested_conformance: 'does_not_support',
          ai_referenced_issues: [],
          last_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto(`/vpats/${vpatId}/edit`);
  await expect(page.getByRole('heading', { name: 'E2E VPAT Edit' })).toBeVisible();

  // Click Level A tab
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  // Find and click the Generate button for 1.1.1
  const generateBtn = page.getByRole('button', { name: /Generate for 1\.1\.1/i });
  await expect(generateBtn).toBeVisible();
  await generateBtn.click();

  // Wait for generation to complete (button returns from "Generating…" to "Generate")
  await expect(page.getByRole('button', { name: /Generate for 1\.1\.1/i })).toBeVisible({
    timeout: 10000,
  });

  // Textarea should now show the AI-generated remarks
  const textarea = page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i });
  await expect(textarea).toHaveValue(generatedRemarks);
});
