import { render, screen } from '@testing-library/react';

import { AllIssuesTable } from '../all-issues-table';
import type { IssueWithContext } from '@/lib/db/issues';

const issue: IssueWithContext = {
  id: 'i1',
  assessment_id: 'a1',
  project_id: 'p1',
  project_name: 'My Project',
  assessment_name: 'Q1 Audit',
  title: 'Missing alt text',
  severity: 'high',
  status: 'open',
  description: null,
  url: null,
  wcag_codes: [],
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
  section_508_codes: [],
  eu_codes: [],
  evidence_media: [],
  tags: [],
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

test('renders issue title as link', () => {
  render(<AllIssuesTable issues={[issue]} />);
  const link = screen.getByRole('link', { name: 'Missing alt text' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/i1');
});

test('renders project name as link', () => {
  render(<AllIssuesTable issues={[issue]} />);
  const link = screen.getByRole('link', { name: 'My Project' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects/p1');
});

test('renders assessment name as link', () => {
  render(<AllIssuesTable issues={[issue]} />);
  const link = screen.getByRole('link', { name: 'Q1 Audit' });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/projects/p1/assessments/a1');
});

test('renders severity badge', () => {
  render(<AllIssuesTable issues={[issue]} />);
  expect(screen.getByText('High')).toBeInTheDocument();
});

test('renders status label', () => {
  render(<AllIssuesTable issues={[issue]} />);
  expect(screen.getByText('Open')).toBeInTheDocument();
});

test('renders empty message when no issues', () => {
  render(<AllIssuesTable issues={[]} />);
  expect(screen.getByText('No issues yet.')).toBeInTheDocument();
});
