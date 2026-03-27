import { render, screen } from '@testing-library/react';
import { ProjectAssessmentsCard } from '../project-assessments-card';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

const assessment: AssessmentWithCounts = {
  id: 'a1',
  project_id: 'p1',
  name: 'Q1 Audit',
  description: null,
  test_date_start: null,
  test_date_end: null,
  status: 'ready',
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  issue_count: 3,
};

test('renders assessments card heading', () => {
  render(
    <ProjectAssessmentsCard projectId="p1" projectName="My Project" assessments={[assessment]} />
  );
  expect(screen.getByText('Assessments')).toBeInTheDocument();
});

test('shows table view by default', () => {
  render(
    <ProjectAssessmentsCard projectId="p1" projectName="My Project" assessments={[assessment]} />
  );
  expect(screen.getByRole('table')).toBeInTheDocument();
});

test('shows empty state when no assessments', () => {
  render(<ProjectAssessmentsCard projectId="p1" projectName="My Project" assessments={[]} />);
  expect(screen.getByText('No assessments yet.')).toBeInTheDocument();
});

