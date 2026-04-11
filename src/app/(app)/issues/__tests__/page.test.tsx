import { render, screen } from '@testing-library/react';

import { NextIntlClientProvider } from 'next-intl';

const messages = {
  issues: {
    badge: {
      severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
      status: { open: 'Open', resolved: 'Resolved', wont_fix: "Won't Fix" },
    },
    delete_dialog: {
      title: 'Delete {name}?',
      description:
        'This will permanently delete this issue and all its attachments. This cannot be undone.',
      confirm_button: 'Delete Issue',
      cancel_button: 'Cancel',
    },
    toast: {
      created: 'Issue created',
      updated: 'Issue updated',
      deleted: 'Issue deleted',
      imported: 'Issues imported',
      create_failed: 'Failed to create issue',
      update_failed: 'Failed to update issue',
      delete_failed: 'Failed to delete issue',
      import_failed: 'Failed to import issues',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
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
  renderWithIntl(await IssuesPage());
  expect(screen.getByRole('heading', { name: /issues/i })).toBeInTheDocument();
});

test('renders issue title', async () => {
  renderWithIntl(await IssuesPage());
  expect(screen.getByText('Missing alt text')).toBeInTheDocument();
});

test('renders project name', async () => {
  renderWithIntl(await IssuesPage());
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
