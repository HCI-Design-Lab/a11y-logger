import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';
import type { Issue } from '@/lib/db/issues';

// Mock heavy criteria constants so render stays fast in this validation-focused test.
vi.mock('@/lib/constants', () => ({
  WCAG_CRITERION_CODES: ['1.1.1', '1.4.3'],
  WCAG_CRITERION_NAMES: { '1.1.1': 'Non-text Content', '1.4.3': 'Contrast (Minimum)' },
  SECTION_508_CRITERION_CODES: ['302.1'],
  SECTION_508_CRITERION_NAMES: { '302.1': 'Without Vision' },
  EN301549_CRITERION_CODES: ['4.2.1'],
  EN301549_CRITERION_NAMES: { '4.2.1': 'Usage without vision' },
}));

const mockIssue: Issue = {
  id: 'i1',
  assessment_id: 'a1',
  title: 'Missing alt text',
  description: 'Image has no alt attribute',
  severity: 'high',
  status: 'open',
  wcag_codes: ['1.1.1'],
  section_508_codes: [],
  eu_codes: [],
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
  url: null,
  evidence_media: [],
  tags: [],
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

test('shows validation error when title is empty on submit', async () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
}, 15000);

test('does not call onSubmit when title is empty', async () => {
  const onSubmit = vi.fn();
  render(<IssueForm onSubmit={onSubmit} projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() => screen.getByRole('alert'));
  expect(onSubmit).not.toHaveBeenCalled();
}, 15000);

test('calls onSubmit with title when form is valid', async () => {
  const onSubmit = vi.fn();
  render(<IssueForm onSubmit={onSubmit} projectId="p1" />);
  await userEvent.type(screen.getByLabelText(/^title/i), 'Button not focusable');
  fireEvent.click(screen.getByRole('button', { name: /save issue/i }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Button not focusable' }),
      expect.anything()
    )
  );
}, 15000);

test('pre-populates title and description from issue prop', () => {
  render(<IssueForm issue={mockIssue} onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByLabelText(/^title/i)).toHaveValue('Missing alt text');
  expect(screen.getByLabelText(/^description$/i)).toHaveValue('Image has no alt attribute');
}, 15000);
