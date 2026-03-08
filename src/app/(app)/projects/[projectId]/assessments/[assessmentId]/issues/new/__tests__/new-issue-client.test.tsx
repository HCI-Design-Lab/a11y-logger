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
    loading,
  }: {
    projectId: string;
    onSubmit: (data: Record<string, unknown>) => void;
    loading?: boolean;
  }) => (
    <div>
      <span data-testid="issue-form-loading">{loading ? 'loading' : 'idle'}</span>
      <button onClick={() => onSubmit({ title: 'Test Issue', severity: 'high' })}>Submit</button>
    </div>
  ),
}));

import { NewIssueClient } from '../new-issue-client';

describe('NewIssueClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the heading and issue form', () => {
    render(<NewIssueClient projectId="p1" assessmentId="a1" />);
    expect(screen.getByRole('heading', { name: 'New Issue' })).toBeInTheDocument();
    expect(screen.getByTestId('issue-form-loading')).toBeInTheDocument();
  });

  it('passes loading=false initially', () => {
    render(<NewIssueClient projectId="p1" assessmentId="a1" />);
    expect(screen.getByTestId('issue-form-loading')).toHaveTextContent('idle');
  });

  it('navigates to the new issue page and shows success toast on successful submission', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { id: 'issue-99' } }),
    });

    render(<NewIssueClient projectId="p1" assessmentId="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1/issues',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Issue', severity: 'high' }),
      })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Issue created');
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1/issues/issue-99');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('shows error toast when API returns success=false', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Validation failed' }),
    });

    render(<NewIssueClient projectId="p1" assessmentId="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockToastError).toHaveBeenCalledWith('Failed to create issue');
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error toast when fetch throws a network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<NewIssueClient projectId="p1" assessmentId="a1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockToastError).toHaveBeenCalledWith('Failed to create issue');
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
