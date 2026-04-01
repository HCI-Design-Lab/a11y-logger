import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { AssessmentsTable } from '@/components/assessments/assessments-table';

const assessments: AssessmentWithCounts[] = [
  {
    id: 'a1',
    project_id: 'p1',
    name: 'Zebra Assessment',
    description: null,
    test_date_start: '2026-01-01T00:00:00',
    test_date_end: null,
    status: 'ready',
    assigned_to: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    issue_count: 5,
  },
  {
    id: 'a2',
    project_id: 'p1',
    name: 'Alpha Assessment',
    description: null,
    test_date_start: '2026-03-01T00:00:00',
    test_date_end: null,
    status: 'completed',
    assigned_to: null,
    created_by: null,
    created_at: '2026-02-01T00:00:00',
    updated_at: '2026-02-01T00:00:00',
    issue_count: 2,
  },
];

test('renders all assessment rows', () => {
  render(<AssessmentsTable assessments={assessments} projectId="p1" />);
  expect(screen.getByText('Zebra Assessment')).toBeInTheDocument();
  expect(screen.getByText('Alpha Assessment')).toBeInTheDocument();
});

test('clicking Name header sorts rows ascending by name', () => {
  render(<AssessmentsTable assessments={assessments} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const rows = screen.getAllByRole('row').slice(1); // skip header
  expect(rows[0]).toHaveTextContent('Alpha Assessment');
  expect(rows[1]).toHaveTextContent('Zebra Assessment');
});

test('clicking Name header twice sorts rows descending by name', () => {
  render(<AssessmentsTable assessments={assessments} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  fireEvent.click(screen.getByRole('button', { name: /name/i }));
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows[0]).toHaveTextContent('Zebra Assessment');
  expect(rows[1]).toHaveTextContent('Alpha Assessment');
});

test('clicking Issues header sorts rows by issue count ascending', () => {
  render(<AssessmentsTable assessments={assessments} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /issues/i }));
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows[0]).toHaveTextContent('Alpha Assessment'); // 2 issues
  expect(rows[1]).toHaveTextContent('Zebra Assessment'); // 5 issues
});

test('clicking Status header sorts rows by status', () => {
  render(<AssessmentsTable assessments={assessments} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /status/i }));
  const rows = screen.getAllByRole('row').slice(1);
  // 'completed' < 'ready' alphabetically
  expect(rows[0]).toHaveTextContent('Alpha Assessment');
  expect(rows[1]).toHaveTextContent('Zebra Assessment');
});
