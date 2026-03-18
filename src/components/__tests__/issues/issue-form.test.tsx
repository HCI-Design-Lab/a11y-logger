import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';
import type { Issue } from '@/lib/db/issues';

test('renders title field as required', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByLabelText(/title/i)).toBeRequired();
}, 15000);

test('renders description textarea', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
}, 15000);

test('renders severity select', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByRole('combobox', { name: /severity/i })).toBeInTheDocument();
}, 15000);

test('renders status select', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
}, 15000);

test('renders save button', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
}, 15000);

test('calls onSubmit with form data on submit', () => {
  const onSubmit = vi.fn();
  render(<IssueForm onSubmit={onSubmit} projectId="p1" />);
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Missing alt text' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Missing alt text' }));
}, 15000);

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
    section_508_codes: [],
    eu_codes: [],
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
  render(<IssueForm issue={issue} onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByLabelText(/title/i)).toHaveValue('Button has no label');
  expect(screen.getByLabelText(/^description$/i)).toHaveValue(
    'The submit button has no accessible name.'
  );
}, 15000);

test('shows loading state on button when loading', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" loading />);
  expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
}, 15000);

test('renders Attachments card', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByText(/attachments/i)).toBeInTheDocument();
}, 15000);

test('includes evidence_media in submitted data after upload', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: { url: '/api/media/p1/tmp/photo.png' } }),
  } as Response);

  const onSubmit = vi.fn();
  render(<IssueForm onSubmit={onSubmit} projectId="p1" />);

  const input = screen.getByLabelText(/choose file/i);
  const file = new File(['img'], 'photo.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith('/api/media/upload', expect.anything())
  );

  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ evidence_media: ['/api/media/p1/tmp/photo.png'] })
  );
}, 15000);

test('renders Section 508 Criteria section', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByText('Section 508 Criteria')).toBeInTheDocument();
}, 15000);

test('renders EU EN 301 549 Criteria section', () => {
  render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
  expect(screen.getByText('EU EN 301 549 Criteria')).toBeInTheDocument();
}, 15000);

test('removes media url when remove button is clicked', () => {
  const onSubmit = vi.fn();
  const existingIssue: Issue = {
    id: 'i1',
    assessment_id: 'a1',
    title: 'Test',
    description: null,
    url: null,
    severity: 'medium',
    status: 'open',
    wcag_codes: [],
    section_508_codes: [],
    eu_codes: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
    device_type: null,
    browser: null,
    operating_system: null,
    assistive_technology: null,
    evidence_media: ['/api/media/p1/i1/photo.png'],
    tags: [],
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };

  render(<IssueForm onSubmit={onSubmit} projectId="p1" issue={existingIssue} />);

  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ evidence_media: [] }));
});
