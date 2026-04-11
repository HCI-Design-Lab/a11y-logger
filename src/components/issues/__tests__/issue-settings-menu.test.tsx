import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const { mockPush, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

global.fetch = vi.fn();

import { IssueSettingsMenu } from '../issue-settings-menu';

const messages = {
  issues: {
    settings_menu: {
      aria_label: 'Issue settings',
      edit: 'Edit Issue',
      delete: 'Delete Issue',
      mark_in_progress: 'Mark as In Progress',
      mark_complete: 'Mark as Complete',
      mark_open: 'Mark as Open',
    },
    delete_dialog: {
      title: 'Delete {name}?',
      description:
        'This will permanently delete this issue and all its attachments. This cannot be undone.',
      confirm_button: 'Delete Issue',
      cancel_button: 'Cancel',
    },
    toast: {
      created: 'Issue created',
      updated: 'Issue updated',
      deleted: 'Issue deleted',
      imported: 'Issues imported',
      create_failed: 'Failed to create issue',
      update_failed: 'Failed to update issue',
      delete_failed: 'Failed to delete issue',
      import_failed: 'Failed to import issues',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

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
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  expect(screen.getByRole('button', { name: /issue settings/i })).toBeInTheDocument();
});

test('dropdown contains Edit Issue link pointing to edit page', async () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  const item = await screen.findByRole('menuitem', { name: /edit issue/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/i1/edit');
});

test('dropdown contains Delete Issue item', async () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  expect(await screen.findByRole('menuitem', { name: /delete issue/i })).toBeInTheDocument();
});

test('clicking Delete Issue opens a confirmation dialog', async () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText(/missing alt text/i)).toBeInTheDocument();
});

test('confirming delete calls the issues API and navigates to assessment', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
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
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalledWith('Failed to delete issue');
  });
  expect(mockPush).not.toHaveBeenCalled();
});
