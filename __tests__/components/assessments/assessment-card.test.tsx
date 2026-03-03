import { render, screen } from '@testing-library/react';
import { AssessmentCard } from '@/components/assessments/assessment-card';
import type { AssessmentWithProject } from '@/lib/db/assessments';

const mockAssessment: AssessmentWithProject = {
  id: 'a1',
  project_id: 'p1',
  project_name: 'My Project',
  name: 'Q1 Audit',
  description: 'Testing the main flows',
  status: 'in_progress',
  issue_count: 5,
  test_date_start: null,
  test_date_end: null,
  assigned_to: null,
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('AssessmentCard', () => {
  it('renders name as a link to the assessment', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1/assessments/a1');
    expect(screen.getByText('Q1 Audit')).toBeInTheDocument();
  });

  it('renders project name', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    expect(screen.getByText('Testing the main flows')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<AssessmentCard assessment={{ ...mockAssessment, description: null }} />);
    expect(screen.queryByText('Testing the main flows')).not.toBeInTheDocument();
  });

  it('renders issue count', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    expect(screen.getByText(/5 issue/i)).toBeInTheDocument();
  });
});
