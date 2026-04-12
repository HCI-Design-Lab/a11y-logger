import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    // Radix UI 1.x generates aria-controls IDs using React 18 SSR format (_R_ prefix)
    // which triggers a false positive on aria-valid-attr-value. Disable until Radix fixes it.
    .disableRules(['aria-valid-attr-value'])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.target.join(', ')).join(' | ')}`
      )
      .join('\n\n');
    expect.soft(results.violations, `Accessibility violations:\n\n${summary}`).toEqual([]);
  }

  expect(results.violations).toEqual([]);
}

// ─── Static routes ────────────────────────────────────────────────────────────

const STATIC_ROUTES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Projects list', path: '/projects' },
  { name: 'New project', path: '/projects/new' },
  { name: 'Assessments list', path: '/assessments' },
  { name: 'New assessment', path: '/assessments/new' },
  { name: 'Issues list', path: '/issues' },
  { name: 'New issue', path: '/issues/new' },
  { name: 'Reports list', path: '/reports' },
  { name: 'New report', path: '/reports/new' },
  { name: 'VPATs list', path: '/vpats' },
  { name: 'New VPAT', path: '/vpats/new' },
  { name: 'Settings', path: '/settings' },
];

for (const route of STATIC_ROUTES) {
  test(`${route.name} has no accessibility violations @a11y`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });
}

// ─── Dynamic routes (require seeded data) ────────────────────────────────────

test.describe('dynamic routes @a11y', () => {
  let projectId: string;
  let assessmentId: string;
  let issueId: string;
  let reportId: string;
  let vpatId: string;

  test.beforeAll(async ({ request }) => {
    // Project
    const projectRes = await request.post('/api/projects', {
      data: { name: 'A11y Test Project' },
    });
    const project = await projectRes.json();
    projectId = project.data.id;

    // Assessment
    const assessmentRes = await request.post(`/api/projects/${projectId}/assessments`, {
      data: { name: 'A11y Test Assessment' },
    });
    const assessment = await assessmentRes.json();
    assessmentId = assessment.data.id;

    // Issue
    const issueRes = await request.post(
      `/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        data: {
          title: 'A11y Test Issue',
          description: 'Test issue for a11y checks',
          severity: 'medium',
          status: 'open',
        },
      }
    );
    const issue = await issueRes.json();
    issueId = issue.data.id;

    // Report
    const reportRes = await request.post('/api/reports', {
      data: { title: 'A11y Test Report', assessment_ids: [assessmentId] },
    });
    const report = await reportRes.json();
    reportId = report.data.id;

    // VPAT
    const vpatRes = await request.post('/api/vpats', {
      data: { title: 'A11y Test VPAT', project_id: projectId },
    });
    const vpat = await vpatRes.json();
    vpatId = vpat.data.id;
  });

  test.afterAll(async ({ request }) => {
    // Deleting the project cascades to assessments and issues
    if (vpatId) await request.delete(`/api/vpats/${vpatId}`);
    if (reportId) await request.delete(`/api/reports/${reportId}`);
    if (projectId) await request.delete(`/api/projects/${projectId}`);
  });

  test('project detail has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('edit project has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}/edit`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('assessment detail has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}/assessments/${assessmentId}`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('edit assessment has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}/assessments/${assessmentId}/edit`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('issue detail has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('edit issue has no accessibility violations', async ({ page }) => {
    await page.goto(`/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}/edit`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('report detail has no accessibility violations', async ({ page }) => {
    await page.goto(`/reports/${reportId}`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('edit report has no accessibility violations', async ({ page }) => {
    await page.goto(`/reports/${reportId}/edit`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('VPAT detail has no accessibility violations', async ({ page }) => {
    await page.goto(`/vpats/${vpatId}`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('edit VPAT has no accessibility violations', async ({ page }) => {
    await page.goto(`/vpats/${vpatId}/edit`);
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });
});
