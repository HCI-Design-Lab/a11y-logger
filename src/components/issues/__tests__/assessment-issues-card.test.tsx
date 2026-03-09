import { render, screen } from '@testing-library/react';
import { AssessmentIssuesCard } from '../assessment-issues-card';
import type { Issue } from '@/lib/db/issues';

const issue: Issue = {
  id: 'i1',
  assessment_id: 'a1',
  title: 'Missing alt text',
  description: null,
  wcag_criterion: null,
  severity: 'high',
  status: 'open',
  affected_url: null,
  steps_to_reproduce: null,
  expected_result: null,
  actual_result: null,
  evidence_notes: null,
  evidence_media: null,
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

const baseProps = { projectId: 'p1', assessmentId: 'a1' };

test('renders issues count in heading', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.getByText('Issues (1)')).toBeInTheDocument();
});

test('renders Add Issue link', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  const link = screen.getByRole('link', { name: /add issue/i });
  expect(link).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/new');
});

test('renders all severity filter links', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.getByRole('link', { name: /^all$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /critical/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /high/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /medium/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /low/i })).toBeInTheDocument();
});

test('severity filter links point to assessment page with search param', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.getByRole('link', { name: /critical/i })).toHaveAttribute(
    'href',
    '/projects/p1/assessments/a1?severity=critical'
  );
  expect(screen.getByRole('link', { name: /^all$/i })).toHaveAttribute(
    'href',
    '/projects/p1/assessments/a1'
  );
});

test('shows issue title when issues exist', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.getByText('Missing alt text')).toBeInTheDocument();
});

test('shows empty state when no issues', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[]} />);
  expect(screen.getByText(/no issues/i)).toBeInTheDocument();
});
