import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import type { Assessment } from '@/lib/db/assessments';

test('renders name field as required', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/name/i)).toBeRequired();
});

test('renders description textarea', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
});

test('renders start date field', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
});

test('renders end date field', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
});

test('renders status select', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
});

test('renders save button', () => {
  render(<AssessmentForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
});

test('calls onSubmit with form data', () => {
  const onSubmit = vi.fn();
  render(<AssessmentForm onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Q1 Audit' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Q1 Audit' }));
});

test('pre-fills with existing assessment data', () => {
  const assessment: Assessment = {
    id: '1',
    project_id: 'p1',
    name: 'Existing Audit',
    description: 'Existing description',
    test_date_start: '2026-01-01T00:00:00.000Z',
    test_date_end: '2026-01-31T00:00:00.000Z',
    status: 'in_progress',
    assigned_to: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };
  render(<AssessmentForm assessment={assessment} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Audit');
  expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
});
