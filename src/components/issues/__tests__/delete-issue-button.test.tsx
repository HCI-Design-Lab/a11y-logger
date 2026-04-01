import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

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

global.fetch = vi.fn();

import { DeleteIssueButton } from '../delete-issue-button';

const defaultProps = {
  projectId: 'p1',
  assessmentId: 'a1',
  issueId: 'i1',
  issueTitle: 'Missing alt text',
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders a trigger button with Trash2 icon', () => {
  render(<DeleteIssueButton {...defaultProps} />);
  const btn = screen.getByRole('button', { name: /delete/i });
  expect(btn.querySelector('svg')).toBeInTheDocument();
});

test('opens confirmation dialog when trigger is clicked', async () => {
  render(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
});

test('AlertDialogCancel has an X icon', async () => {
  render(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
  expect(cancelBtn.querySelector('svg')).toBeInTheDocument();
});

test('AlertDialogAction has a Trash2 icon', async () => {
  render(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  const deleteBtn = await screen.findByRole('button', { name: /delete issue/i });
  expect(deleteBtn.querySelector('svg')).toBeInTheDocument();
});

test('confirming delete calls API and navigates to assessment', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  render(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1/issues/i1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
  expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1');
  expect(mockToastSuccess).toHaveBeenCalledWith('Issue deleted');
});

test('calls toast.error when DELETE API returns { success: false }', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false, error: 'Not found' }),
  });
  render(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalledWith('Failed to delete issue');
  });
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockToastSuccess).not.toHaveBeenCalled();
});
