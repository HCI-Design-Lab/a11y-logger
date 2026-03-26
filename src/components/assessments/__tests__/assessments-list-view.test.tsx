import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/assessments/all-assessments-table', () => ({
  AllAssessmentsTable: () => <div data-testid="assessments-table" />,
}));
vi.mock('@/components/assessments/assessment-card', () => ({
  AssessmentCard: ({ assessment }: { assessment: { id: string; name: string } }) => (
    <div data-testid="assessment-card">{assessment.name}</div>
  ),
}));

import { AssessmentsListView } from '../assessments-list-view';
import type { AssessmentWithProject } from '@/lib/db/assessments';

const mockAssessment: AssessmentWithProject = {
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
  project_name: 'My Project',
};

describe('AssessmentsListView layout', () => {
  it('renders the New Assessment link', () => {
    render(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('link', { name: /new assessment/i })).toBeInTheDocument();
  });

  it('ViewToggle is in the header row with the New Assessment button', () => {
    render(<AssessmentsListView assessments={[]} />);
    const heading = screen.getByRole('heading', { name: 'Assessments' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    render(<AssessmentsListView assessments={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });

  it('switches to grid view when Grid view button is clicked', async () => {
    render(<AssessmentsListView assessments={[mockAssessment]} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.getByTestId('assessment-card')).toBeInTheDocument();
    expect(screen.queryByTestId('assessments-table')).not.toBeInTheDocument();
  });
});
