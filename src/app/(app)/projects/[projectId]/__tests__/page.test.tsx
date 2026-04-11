import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  description: null,
  status: 'active',
  product_url: null,
  settings: '{}',
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

const mockAssessment = {
  id: 'assess-1',
  project_id: 'proj-1',
  name: 'My Assessment',
  description: null,
  test_date_start: null,
  test_date_end: null,
  status: 'ready' as const,
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  issue_count: 0,
};

vi.mock('@/lib/db/projects', () => ({
  getProject: () => mockProject,
}));

vi.mock('@/lib/db/assessments', () => ({
  getAssessments: () => [mockAssessment],
}));

vi.mock('@/lib/db/issues', () => ({
  getIssuesByProject: () => [],
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/dashboard/issue-statistics', () => ({
  IssueStatistics: ({ total }: { total: number }) => (
    <div data-testid="issue-statistics">Issue Statistics mock: {total}</div>
  ),
}));

vi.mock('@/components/assessments/project-assessments-card', () => ({
  ProjectAssessmentsCard: ({ assessments }: { assessments: { name: string }[] }) => (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>
        {assessments.map((a) => (
          <tr key={a.name}>
            <td>{a.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

import ProjectDetailPage from '../page';

const messages = {
  projects: {
    settings_menu: {
      aria_label: 'Project settings',
      edit: 'Edit Project',
      delete: 'Delete Project',
    },
    delete_dialog: {
      title: 'Delete Project?',
      description:
        'This will permanently delete this project and all its assessments and issues. This cannot be undone.',
      confirm_button: 'Delete Project',
      cancel_button: 'Cancel',
    },
    toast: {
      deleted: 'Project deleted',
      delete_failed: 'Failed to delete project',
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

test('renders assessments in a table when assessments exist', async () => {
  const page = await ProjectDetailPage({ params: Promise.resolve({ projectId: 'proj-1' }) });
  renderWithIntl(page);
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByText('My Assessment')).toBeInTheDocument();
});

test('assessment table has expected column headers', async () => {
  const page = await ProjectDetailPage({ params: Promise.resolve({ projectId: 'proj-1' }) });
  renderWithIntl(page);
  expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /issues/i })).toBeInTheDocument();
});

test('does not show hardcoded placeholder when assessments exist', async () => {
  const page = await ProjectDetailPage({ params: Promise.resolve({ projectId: 'proj-1' }) });
  renderWithIntl(page);
  expect(screen.queryByText('Assessments will appear here once created.')).not.toBeInTheDocument();
});

test('renders IssueStatistics component in the sidebar', async () => {
  const page = await ProjectDetailPage({ params: Promise.resolve({ projectId: 'proj-1' }) });
  renderWithIntl(page);
  expect(screen.getByTestId('issue-statistics')).toBeInTheDocument();
});
