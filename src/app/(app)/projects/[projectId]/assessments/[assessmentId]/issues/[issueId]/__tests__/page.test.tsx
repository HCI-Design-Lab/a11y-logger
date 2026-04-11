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

vi.mock('@/lib/db/projects', () => ({
  getProject: () => ({ id: 'p1', name: 'My Project' }),
}));

vi.mock('@/lib/db/assessments', () => ({
  getAssessment: () => ({
    id: 'a1',
    name: 'Q1 Audit',
  }),
}));

vi.mock('@/lib/db/issues', () => ({
  getIssue: () => ({
    id: 'i1',
    assessment_id: 'a1',
    title: 'Missing alt text',
    description: 'Image has no alt attribute.',
    url: 'https://example.com/page',
    severity: 'high',
    status: 'open',
    wcag_codes: [],
    section_508_codes: [],
    eu_codes: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
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
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

vi.mock('@/components/issues/issue-settings-menu', () => ({
  IssueSettingsMenu: () => <button aria-label="Issue settings">Settings</button>,
}));

vi.mock('@/components/issues/media-gallery', () => ({
  MediaGallery: () => <div>Gallery</div>,
}));

import IssueDetailPage from '../page';

const defaultProps = {
  params: Promise.resolve({ projectId: 'p1', assessmentId: 'a1', issueId: 'i1' }),
};

test('renders issue title', async () => {
  const page = await IssueDetailPage(defaultProps);
  renderWithIntl(page);
  expect(screen.getByRole('heading', { name: 'Missing alt text' })).toBeInTheDocument();
});

test('assessment name link appears below the issue title in the header', async () => {
  const page = await IssueDetailPage(defaultProps);
  renderWithIntl(page);
  // There should be an assessment link directly in the header area (not just breadcrumbs)
  // Find the header section by looking for the space-y-2 wrapper around title+subtitle
  const heading = screen.getByRole('heading', { name: 'Missing alt text' });
  const headerWrapper = heading.closest('[class*="space-y"]');
  const assessmentLink = headerWrapper?.querySelector('a[href="/projects/p1/assessments/a1"]');
  expect(assessmentLink).toBeInTheDocument();
  expect(assessmentLink).toHaveTextContent('Q1 Audit');
});

test('URL is shown inside the details card with a URL section heading', async () => {
  const page = await IssueDetailPage(defaultProps);
  renderWithIntl(page);
  expect(screen.getByText('URL')).toBeInTheDocument();
  const urlLink = screen.getByRole('link', { name: 'https://example.com/page' });
  expect(urlLink).toBeInTheDocument();
  expect(urlLink).toHaveAttribute('href', 'https://example.com/page');
});

test('URL link does not appear in the header area', async () => {
  const page = await IssueDetailPage(defaultProps);
  renderWithIntl(page);
  const heading = screen.getByRole('heading', { name: 'Missing alt text' });
  const headerWrapper = heading.closest('[class*="space-y"]');
  expect(headerWrapper).not.toHaveTextContent('https://example.com/page');
});

test('renders IssueSettingsMenu in the hero card header', async () => {
  const page = await IssueDetailPage(defaultProps);
  renderWithIntl(page);
  expect(screen.getByRole('button', { name: /issue settings/i })).toBeInTheDocument();
});
