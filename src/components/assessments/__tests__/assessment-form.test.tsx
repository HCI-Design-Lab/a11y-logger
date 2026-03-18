import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AssessmentForm } from '../assessment-form';
import type { Assessment } from '@/lib/db/assessments';

const mockAssessment: Assessment = {
  id: 'a1',
  project_id: 'p1',
  name: 'Q1 Audit',
  description: 'Quarterly accessibility check',
  status: 'in_progress',
  test_date_start: '2026-01-01T00:00:00.000Z',
  test_date_end: '2026-01-31T00:00:00.000Z',
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

test('renders name field', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
});

test('shows validation error when name is empty', async () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /save assessment/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
});

test('does not call onSubmit when name is empty', async () => {
  const onSubmit = vi.fn();
  render(<AssessmentForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: /save assessment/i }));
  await waitFor(() => screen.getByRole('alert'));
  expect(onSubmit).not.toHaveBeenCalled();
});

test('calls onSubmit with correct values', async () => {
  const onSubmit = vi.fn();
  render(<AssessmentForm onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText(/name/i), 'Q2 Audit');
  fireEvent.click(screen.getByRole('button', { name: /save assessment/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Q2 Audit' }),
      expect.anything()
    )
  );
});

test('pre-populates fields from assessment prop', () => {
  render(<AssessmentForm assessment={mockAssessment} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/name/i)).toHaveValue('Q1 Audit');
  expect(screen.getByLabelText(/description/i)).toHaveValue('Quarterly accessibility check');
  // Date inputs should show YYYY-MM-DD portion
  expect(screen.getByLabelText(/start date/i)).toHaveValue('2026-01-01');
  expect(screen.getByLabelText(/end date/i)).toHaveValue('2026-01-31');
});
