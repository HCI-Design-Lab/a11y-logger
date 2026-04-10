import { test, expect } from '@playwright/test';

/**
 * E2E tests for VPAT edit page — remarks persistence and AI generation.
 *
 * Each test creates its own project + VPAT via the API and cleans up after itself.
 */

let projectId: string;

test.beforeEach(async ({ request }) => {
  const projectRes = await request.post('/api/projects', {
    data: { name: 'E2E VPAT Edit Project' },
  });
  expect(projectRes.ok()).toBeTruthy();
  projectId = (await projectRes.json()).data.id;
});

test.afterEach(async ({ request }) => {
  if (projectId) await request.delete(`/api/projects/${projectId}`);
});

// ─── Single-component row ────────────────────────────────────────────────────

test('single-component: typing remarks and saving persists to view and edit pages', async ({
  page,
  request,
}) => {
  const vpatRes = await request.post('/api/vpats', {
    data: {
      title: 'E2E VPAT Single',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'], // single component → standard row layout
    },
  });
  expect(vpatRes.ok()).toBeTruthy();
  const vpatId = (await vpatRes.json()).data.id;

  await page.goto(`/vpats/${vpatId}/edit`);
  await expect(page.getByRole('heading', { name: 'E2E VPAT Single' })).toBeVisible();

  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  const textarea = page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i });
  await expect(textarea).toBeVisible();

  await textarea.fill('Test single');
  await page.waitForTimeout(600);

  const patchDone = page.waitForResponse(
    (resp) => resp.url().includes('/rows/') && resp.request().method() === 'PATCH'
  );
  await page.getByRole('button', { name: /Save VPAT/i }).click();
  await patchDone;

  await expect(page).toHaveURL(new RegExp(`/vpats/${vpatId}$`), { timeout: 10000 });
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();
  await expect(page.getByText('Test single')).toBeVisible();

  // Back to edit — value should still be there
  await page.goto(`/vpats/${vpatId}/edit`);
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i })).toHaveValue(
    'Test single'
  );
});

// ─── Multi-component row ─────────────────────────────────────────────────────

test('multi-component: typing remarks saves via component API and persists', async ({
  page,
  request,
}) => {
  // web + software-desktop + documents produces 3 components (web / software / electronic-docs)
  const vpatRes = await request.post('/api/vpats', {
    data: {
      title: 'E2E VPAT Multi',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web', 'software-desktop', 'documents'],
    },
  });
  expect(vpatRes.ok()).toBeTruthy();
  const vpatId = (await vpatRes.json()).data.id;

  await page.goto(`/vpats/${vpatId}/edit`);
  await expect(page.getByRole('heading', { name: 'E2E VPAT Multi' })).toBeVisible();

  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  // The "web" component's remarks textarea for 1.1.1
  const textarea = page.getByRole('textbox', {
    name: /Remarks for 1\.1\.1 — web/i,
  });
  await expect(textarea).toBeVisible();

  // Type and wait for the component PUT to fire
  const putDone = page.waitForResponse(
    (resp) => resp.url().includes('/components/') && resp.request().method() === 'PUT'
  );
  await textarea.fill('Test multi-component');
  await putDone;

  // Navigate to the read-only view and verify the remark shows
  await page.goto(`/vpats/${vpatId}`);
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();
  await expect(page.getByText('Test multi-component')).toBeVisible();

  // Back to edit — textarea should still show the value
  await page.goto(`/vpats/${vpatId}/edit`);
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /Remarks for 1\.1\.1 — web/i })).toHaveValue(
    'Test multi-component'
  );
});

// ─── AI generation ───────────────────────────────────────────────────────────

test('AI generation updates the textarea with generated remarks', async ({ page, request }) => {
  const vpatRes = await request.post('/api/vpats', {
    data: {
      title: 'E2E VPAT AI',
      project_id: projectId,
      standard_edition: 'WCAG',
      wcag_version: '2.1',
      wcag_level: 'AA',
      product_scope: ['web'],
    },
  });
  expect(vpatRes.ok()).toBeTruthy();
  const vpatId = (await vpatRes.json()).data.id;

  const vpatData = (await (await request.get(`/api/vpats/${vpatId}`)).json()).data;
  const row111 = vpatData.criterion_rows.find(
    (r: { criterion_code: string }) => r.criterion_code === '1.1.1'
  );
  expect(row111).toBeTruthy();

  const generatedRemarks = 'AI generated: Images must have descriptive alt text.';

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
          ai_reasoning: 'Based on issues found.',
          ai_suggested_conformance: 'does_not_support',
          ai_referenced_issues: [],
          last_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto(`/vpats/${vpatId}/edit`);
  await expect(page.getByRole('heading', { name: 'E2E VPAT AI' })).toBeVisible();
  await page.getByRole('tab', { name: 'Level A', exact: true }).click();

  await page.getByRole('button', { name: /Generate for 1\.1\.1/i }).click();
  await expect(page.getByRole('button', { name: /Generate for 1\.1\.1/i })).toBeVisible({
    timeout: 10000,
  });

  await expect(page.getByRole('textbox', { name: /Remarks for 1\.1\.1/i })).toHaveValue(
    generatedRemarks
  );
});
