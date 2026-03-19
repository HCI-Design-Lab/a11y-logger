import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/db/assessments', () => ({
  getAllAssessments: () => [
    {
      id: 'a1',
      project_id: 'p1',
      project_name: 'My Project',
      name: 'My Assessment',
      description: null,
      test_date_start: null,
      test_date_end: null,
      status: 'ready',
      assigned_to: null,
      created_by: null,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-01T00:00:00',
      issue_count: 3,
    },
  ],
}));

import AssessmentsPage from '../page';

test('renders page heading', () => {
  render(<AssessmentsPage />);
  expect(screen.getByRole('heading', { name: /assessments/i })).toBeInTheDocument();
});

test('renders assessment name', () => {
  render(<AssessmentsPage />);
  expect(screen.getByText('My Assessment')).toBeInTheDocument();
});

test('renders project name', () => {
  render(<AssessmentsPage />);
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
