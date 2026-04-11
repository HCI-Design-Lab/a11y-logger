import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/db/issues', () => ({
  getAllIssues: () =>
    Promise.resolve([
      {
        id: 'i1',
        assessment_id: 'a1',
        project_id: 'p1',
        project_name: 'My Project',
        assessment_name: 'My Assessment',
        title: 'Missing alt text',
        severity: 'high',
        status: 'open',
        description: null,
        url: null,
        wcag_codes: [],
        ai_suggested_codes: [],
        ai_confidence_score: null,
        device_type: null,
        browser: null,
        operating_system: null,
        assistive_technology: null,
        evidence_media: [],
        tags: [],
        created_by: null,
        resolved_by: null,
        resolved_at: null,
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
      },
    ]),
}));

import IssuesPage from '../page';

test('renders page heading', async () => {
  render(await IssuesPage());
  expect(screen.getByRole('heading', { name: /issues/i })).toBeInTheDocument();
});

test('renders issue title', async () => {
  render(await IssuesPage());
  expect(screen.getByText('Missing alt text')).toBeInTheDocument();
});

test('renders project name', async () => {
  render(await IssuesPage());
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
