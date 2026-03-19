import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/db/projects', () => ({
  getProject: () => ({ id: 'p1', name: 'My Project' }),
}));

vi.mock('@/lib/db/assessments', () => ({
  getAssessment: () => ({
    id: 'a1',
    project_id: 'p1',
    name: 'My Assessment',
    description: null,
    test_date_start: null,
    test_date_end: null,
    status: 'ready',
    assigned_to: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  }),
}));

vi.mock('@/lib/db/issues', () => ({
  getIssues: () => [],
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/issues/assessment-issues-card', () => ({
  AssessmentIssuesCard: () => <div data-testid="assessment-issues-card" />,
}));

vi.mock('@/components/assessments/delete-assessment-button', () => ({
  DeleteAssessmentButton: () => <button>Delete</button>,
}));

vi.mock('@/components/assessments/status-transition-button', () => ({
  StatusTransitionButton: () => <button>Transition</button>,
}));

vi.mock('@/components/dashboard/issue-statistics', () => ({
  IssueStatistics: ({ total }: { total: number }) => (
    <div data-testid="issue-statistics">Issue Statistics mock: {total}</div>
  ),
}));

import AssessmentDetailPage from '../page';

const defaultProps = {
  params: Promise.resolve({ projectId: 'p1', assessmentId: 'a1' }),
  searchParams: Promise.resolve({}),
};

test('renders IssueStatistics component in the sidebar', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByTestId('issue-statistics')).toBeInTheDocument();
});

test('renders AssessmentIssuesCard', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByTestId('assessment-issues-card')).toBeInTheDocument();
});
