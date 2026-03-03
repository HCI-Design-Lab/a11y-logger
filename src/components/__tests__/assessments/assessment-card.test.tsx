import { render, screen } from '@testing-library/react';
import { AssessmentCard } from '@/components/assessments/assessment-card';
import type { AssessmentWithProject } from '@/lib/db/assessments';

const mockAssessment: AssessmentWithProject = {
  id: '1',
  project_id: 'p1',
  project_name: 'Test Project',
  name: 'Mobile Audit Q1',
  description: 'Full audit of mobile app',
  test_date_start: '2026-01-01T00:00:00.000Z',
  test_date_end: '2026-01-31T00:00:00.000Z',
  status: 'in_progress',
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  issue_count: 5,
};

test('renders assessment name', () => {
  render(<AssessmentCard assessment={mockAssessment} />);
  expect(screen.getByText('Mobile Audit Q1')).toBeInTheDocument();
});

test('renders assessment description', () => {
  render(<AssessmentCard assessment={mockAssessment} />);
  expect(screen.getByText('Full audit of mobile app')).toBeInTheDocument();
});

test('shows status badge', () => {
  render(<AssessmentCard assessment={mockAssessment} />);
  expect(screen.getByText(/in.progress/i)).toBeInTheDocument();
});

test('shows issue count', () => {
  render(<AssessmentCard assessment={mockAssessment} />);
  expect(screen.getByText(/5 issues/i)).toBeInTheDocument();
});

test('links to assessment detail', () => {
  render(<AssessmentCard assessment={mockAssessment} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1/assessments/1');
});

test('shows planning status badge with correct style', () => {
  const planning = { ...mockAssessment, status: 'planning' as const };
  render(<AssessmentCard assessment={planning} />);
  expect(screen.getByText(/planning/i)).toBeInTheDocument();
});

test('shows completed status badge', () => {
  const completed = { ...mockAssessment, status: 'completed' as const };
  render(<AssessmentCard assessment={completed} />);
  expect(screen.getByText(/completed/i)).toBeInTheDocument();
});

test('planning badge has gray style', () => {
  const planning = { ...mockAssessment, status: 'planning' as const };
  render(<AssessmentCard assessment={planning} />);
  const badge = screen.getByText(/planning/i);
  expect(badge).toHaveClass('bg-gray-100');
});
