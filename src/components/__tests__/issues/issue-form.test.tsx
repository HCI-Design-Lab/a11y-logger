import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';
import type { Issue } from '@/lib/db/issues';

test('renders title field as required', () => {
  render(<IssueForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/title/i)).toBeRequired();
});

test('renders description textarea', () => {
  render(<IssueForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
});

test('renders severity select', () => {
  render(<IssueForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('combobox', { name: /severity/i })).toBeInTheDocument();
});

test('renders status select', () => {
  render(<IssueForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
});

test('renders save button', () => {
  render(<IssueForm onSubmit={vi.fn()} />);
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
});

test('calls onSubmit with form data on submit', () => {
  const onSubmit = vi.fn();
  render(<IssueForm onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Missing alt text' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Missing alt text' }));
});

test('pre-fills data when editing existing issue', () => {
  const issue: Issue = {
    id: 'i1',
    assessment_id: 'a1',
    title: 'Button has no label',
    description: 'The submit button has no accessible name.',
    url: 'https://example.com/page',
    severity: 'high',
    status: 'open',
    wcag_codes: ['4.1.2'],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
    device_type: 'desktop',
    browser: 'Chrome',
    operating_system: 'macOS',
    assistive_technology: 'VoiceOver',
    evidence_media: [],
    tags: ['buttons'],
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };
  render(<IssueForm issue={issue} onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/title/i)).toHaveValue('Button has no label');
  expect(screen.getByLabelText(/^description$/i)).toHaveValue(
    'The submit button has no accessible name.'
  );
});

test('shows loading state on button when loading', () => {
  render(<IssueForm onSubmit={vi.fn()} loading />);
  expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
});
