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

import { IssueSettingsMenu } from '../issue-settings-menu';

const defaultProps = {
  projectId: 'p1',
  assessmentId: 'a1',
  issueId: 'i1',
  issueTitle: 'Missing alt text',
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders a settings trigger button', () => {
  render(<IssueSettingsMenu {...defaultProps} />);
  expect(screen.getByRole('button', { name: /issue settings/i })).toBeInTheDocument();
});

test('dropdown contains Edit Issue link pointing to edit page', async () => {
  render(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  const item = await screen.findByRole('menuitem', { name: /edit issue/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/i1/edit');
});

test('dropdown contains Delete Issue item', async () => {
  render(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  expect(await screen.findByRole('menuitem', { name: /delete issue/i })).toBeInTheDocument();
});

test('clicking Delete Issue opens a confirmation dialog', async () => {
  render(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText(/missing alt text/i)).toBeInTheDocument();
});

test('confirming delete calls the issues API and navigates to assessment', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  render(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
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

test('failed delete shows error toast', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false, error: 'DB error' }),
  });
  render(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalledWith('Failed to delete issue');
  });
  expect(mockPush).not.toHaveBeenCalled();
});
