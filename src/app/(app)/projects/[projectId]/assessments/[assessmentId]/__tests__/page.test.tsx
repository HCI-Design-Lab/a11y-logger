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

vi.mock('@/components/assessments/assessment-settings-menu', () => ({
  AssessmentSettingsMenu: ({ currentStatus }: { currentStatus: string }) => (
    <div data-testid="assessment-settings-menu" data-status={currentStatus} />
  ),
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

test('renders assessment name in hero card', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByRole('heading', { name: 'My Assessment' })).toBeInTheDocument();
});

test('renders status badge', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByText('Ready')).toBeInTheDocument();
});

test('renders AssessmentSettingsMenu', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByTestId('assessment-settings-menu')).toBeInTheDocument();
});

test('does not render standalone Edit link', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.queryByRole('link', { name: /^edit$/i })).not.toBeInTheDocument();
});

test('does not render DeleteAssessmentButton on detail page', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
});

test('passes assessment status to AssessmentSettingsMenu', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.getByTestId('assessment-settings-menu')).toHaveAttribute('data-status', 'ready');
});

test('does not render StatusTransitionButton', async () => {
  const page = await AssessmentDetailPage(defaultProps);
  render(page);
  expect(screen.queryByRole('button', { name: /transition/i })).not.toBeInTheDocument();
});
