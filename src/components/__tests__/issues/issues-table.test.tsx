import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { Issue } from '@/lib/db/issues';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { IssuesTable } from '@/components/issues/issues-table';

const base = {
  description: null,
  url: null,
  wcag_codes: [],
  ai_suggested_codes: [],
  ai_confidence_score: null,
  device_type: null,
  browser: null,
  operating_system: null,
  assistive_technology: null,
  evidence_media: [],
  tags: [],
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  updated_at: '2026-01-01T00:00:00',
};

const issues: Issue[] = [
  {
    ...base,
    id: 'i1',
    assessment_id: 'a1',
    title: 'Missing alt text',
    severity: 'high',
    status: 'open',
    created_at: '2026-03-01T00:00:00',
  },
  {
    ...base,
    id: 'i2',
    assessment_id: 'a1',
    title: 'Low contrast',
    severity: 'critical',
    status: 'resolved',
    created_at: '2026-01-01T00:00:00',
  },
];

test('renders all issue rows', () => {
  render(<IssuesTable issues={issues} projectId="p1" assessmentId="a1" />);
  expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  expect(screen.getByText('Low contrast')).toBeInTheDocument();
});

test('renders column headers: Title, Severity, Status, Created', () => {
  render(<IssuesTable issues={issues} projectId="p1" assessmentId="a1" />);
  expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /severity/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: /created/i })).toBeInTheDocument();
});

test('clicking Severity header sorts by severity ascending', () => {
  render(<IssuesTable issues={issues} projectId="p1" assessmentId="a1" />);
  fireEvent.click(screen.getByRole('button', { name: /severity/i }));
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows[0]).toHaveTextContent('Low contrast'); // critical < high
  expect(rows[1]).toHaveTextContent('Missing alt text');
});

test('clicking Title header sorts by title ascending', () => {
  render(<IssuesTable issues={issues} projectId="p1" assessmentId="a1" />);
  fireEvent.click(screen.getByRole('button', { name: /title/i }));
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows[0]).toHaveTextContent('Low contrast');
  expect(rows[1]).toHaveTextContent('Missing alt text');
});

test('shows empty message when no issues', () => {
  render(<IssuesTable issues={[]} projectId="p1" assessmentId="a1" />);
  expect(screen.getByText('No issues yet.')).toBeInTheDocument();
});
