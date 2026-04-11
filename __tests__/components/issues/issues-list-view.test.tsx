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
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn() }),
}));

import { IssuesListView } from '@/components/issues/issues-list-view';
import type { IssueWithContext } from '@/lib/db/issues';

const mockIssues: IssueWithContext[] = [
  {
    id: 'i1',
    assessment_id: 'a1',
    project_id: 'p1',
    project_name: 'My Project',
    assessment_name: 'Q1 Audit',
    title: 'Missing alt text',
    description: null,
    severity: 'high',
    status: 'open',
    url: null,
    wcag_codes: [],
    section_508_codes: [],
    eu_codes: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    device_type: null,
    browser: null,
    operating_system: null,
    assistive_technology: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
    evidence_media: [],
    tags: [],
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('IssuesListView', () => {
  it('defaults to table view', () => {
    renderWithIntl(<IssuesListView issues={mockIssues} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    renderWithIntl(<IssuesListView issues={mockIssues} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });
});
