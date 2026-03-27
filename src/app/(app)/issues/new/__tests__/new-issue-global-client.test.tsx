import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPush, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock('@/components/issues/issue-form', () => ({
  IssueForm: ({
    onSubmit,
    assessmentOptions,
    onAssessmentChange,
    loading,
    externalButtons,
  }: {
    projectId: string;
    onSubmit: (data: Record<string, unknown>) => void;
    assessmentOptions?: Array<{ id: string; name: string; projectId: string; projectName: string }>;
    onAssessmentChange?: (assessmentId: string, projectId: string) => void;
    loading?: boolean;
    externalButtons?: string;
  }) => (
    <form
      id={externalButtons}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title: 'Test Issue', severity: 'high' });
      }}
    >
      <span data-testid="assessment-options-count">{assessmentOptions?.length ?? 0}</span>
      <span data-testid="issue-form-loading">{loading ? 'loading' : 'idle'}</span>
      <button onClick={() => onAssessmentChange?.('a1', 'p1')}>Select Assessment</button>
      <button type="submit">Submit</button>
    </form>
  ),
}));

import { NewIssueGlobalClient } from '../new-issue-global-client';
import type { AssessmentWithProject } from '@/lib/db/assessments';

const assessments: AssessmentWithProject[] = [
  {
    id: 'a1',
    project_id: 'p1',
    name: 'Q1 Audit',
    project_name: 'My Project',
    description: null,
    test_date_start: null,
    test_date_end: null,
    status: 'ready',
    assigned_to: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    issue_count: 0,
  },
];

describe('NewIssueGlobalClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the heading and issue form', () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    expect(screen.getByRole('heading', { name: 'New Issue' })).toBeInTheDocument();
  });

  it('passes all assessments as assessmentOptions to IssueForm', () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    expect(screen.getByTestId('assessment-options-count')).toHaveTextContent('1');
  });

  it('passes loading=false initially', () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    expect(screen.getByTestId('issue-form-loading')).toHaveTextContent('idle');
  });

  it('navigates and shows success toast after successful submission', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { id: 'issue-99' } }),
    });

    render(<NewIssueGlobalClient assessments={assessments} />);
    await userEvent.click(screen.getByRole('button', { name: 'Select Assessment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1/issues',
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Issue created');
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1/issues/issue-99');
  });

  it('shows error toast when no assessment is selected and form is submitted', async () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockToastError).toHaveBeenCalledWith('Please select an assessment first.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error toast when API returns success=false', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Validation failed' }),
    });

    render(<NewIssueGlobalClient assessments={assessments} />);
    await userEvent.click(screen.getByRole('button', { name: 'Select Assessment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockToastError).toHaveBeenCalledWith('Failed to create issue');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error toast when fetch throws a network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<NewIssueGlobalClient assessments={assessments} />);
    await userEvent.click(screen.getByRole('button', { name: 'Select Assessment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockToastError).toHaveBeenCalledWith('Failed to create issue');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders a Cancel link pointing to /issues', () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/issues');
  });

  it('renders a Save Issue submit button with the form attribute', () => {
    render(<NewIssueGlobalClient assessments={assessments} />);
    const btn = screen.getByRole('button', { name: /save issue/i });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toHaveAttribute('form', 'new-issue-form');
  });
});
