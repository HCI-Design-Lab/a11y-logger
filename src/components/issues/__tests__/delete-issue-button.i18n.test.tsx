import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

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

const messages = {
  issues: {
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

test('renders trigger button with translated label', () => {
  renderWithIntl(<DeleteIssueButton {...defaultProps} />);
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('dialog shows translated title with issue name', async () => {
  renderWithIntl(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText(/missing alt text/i)).toBeInTheDocument();
});

test('dialog confirm button uses translated label', async () => {
  renderWithIntl(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByRole('button', { name: /delete issue/i })).toBeInTheDocument();
});

test('translated delete toast is shown on successful delete', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<DeleteIssueButton {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await vi.waitFor(() => {
    expect(mockToastSuccess).toHaveBeenCalledWith('Issue deleted');
  });
});
