import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssessmentIssuesCard } from '../assessment-issues-card';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
import type { Issue } from '@/lib/db/issues';

const issue: Issue = {
  id: 'i1',
  assessment_id: 'a1',
  title: 'Missing alt text',
  description: null,
  url: null,
  severity: 'high',
  status: 'open',
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

const baseProps = { projectId: 'p1', assessmentId: 'a1' };

test('renders issues count in heading', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.getByText('Issues (1)')).toBeInTheDocument();
});

test('does not render Add Issue link (moved to settings menu)', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.queryByRole('link', { name: /add issue/i })).not.toBeInTheDocument();
});

test('does not render Import button (moved to settings menu)', () => {
  render(<AssessmentIssuesCard {...baseProps} issues={[issue]} />);
  expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
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
