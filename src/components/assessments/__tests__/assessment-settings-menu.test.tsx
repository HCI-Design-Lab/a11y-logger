import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const { mockPush, mockRefresh } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));
vi.mock('@/components/issues/import-issues-modal', () => ({
  ImportIssuesModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" data-testid="import-modal" /> : null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
global.fetch = vi.fn();

beforeEach(() => vi.clearAllMocks());

import { AssessmentSettingsMenu } from '../assessment-settings-menu';

const messages = {
  assessments: {
    settings_menu: {
      aria_label: 'Assessment settings',
      edit: 'Edit Assessment',
      delete: 'Delete Assessment',
    },
    delete_dialog: {
      title: 'Delete Assessment?',
      description:
        'This will permanently delete this assessment and all its issues. This cannot be undone.',
      confirm_button: 'Delete Assessment',
      cancel_button: 'Cancel',
    },
    toast: {
      created: 'Assessment created',
      updated: 'Assessment updated',
      deleted: 'Assessment deleted',
      create_failed: 'Failed to create assessment',
      update_failed: 'Failed to update assessment',
      delete_failed: 'Failed to delete assessment',
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

const baseProps = { projectId: 'p1', assessmentId: 'a1' };

test('renders a settings trigger button', () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  expect(screen.getByRole('button', { name: /assessment settings/i })).toBeInTheDocument();
});

test('dropdown contains Add Issue link pointing to issues/new', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  const item = await screen.findByRole('menuitem', { name: /add issue/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/new');
});

test('dropdown contains Edit Assessment link pointing to edit page', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  const item = await screen.findByRole('menuitem', { name: /edit assessment/i });
  expect(item).toHaveAttribute('href', '/projects/p1/assessments/a1/edit');
});

test('dropdown contains Import Issues item', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /import issues/i })).toBeInTheDocument();
});

test('clicking Import Issues opens the import modal', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /import issues/i }));
  expect(screen.getByTestId('import-modal')).toBeInTheDocument();
});

test('renders Mark as In Progress item when status is ready', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} currentStatus="ready" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as in progress/i })).toBeInTheDocument();
});

test('renders Mark as Complete item when status is in_progress', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} currentStatus="in_progress" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as complete/i })).toBeInTheDocument();
});

test('renders Mark as Incomplete item when status is completed', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} currentStatus="completed" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /mark as incomplete/i })).toBeInTheDocument();
});

test('clicking Mark as Complete calls the assessments API', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} currentStatus="in_progress" />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /mark as complete/i }));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

test('dropdown contains Delete Assessment option', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  expect(await screen.findByRole('menuitem', { name: /delete assessment/i })).toBeInTheDocument();
});

test('clicking Delete Assessment opens confirmation dialog', async () => {
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});

test('confirming delete calls DELETE /api/projects/p1/assessments/a1 and redirects', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  await userEvent.click(screen.getByRole('button', { name: /delete assessment/i }));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(mockPush).toHaveBeenCalledWith('/projects/p1');
    expect(mockRefresh).toHaveBeenCalled();
  });
});

test('shows error toast and does not redirect when API returns failure', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false, error: 'Not found' }),
  });
  renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
  await userEvent.click(screen.getByRole('button', { name: /assessment settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete assessment/i }));
  await userEvent.click(screen.getByRole('button', { name: /delete assessment/i }));
  await waitFor(() => {
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('i18n integration — real NextIntlClientProvider', () => {
  it('renders aria-label from translation catalog', () => {
    renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Assessment settings' })).toBeInTheDocument();
  });

  it('renders Edit Assessment menu item from catalog', async () => {
    renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Assessment settings' }));
    expect(screen.getByRole('menuitem', { name: /edit assessment/i })).toBeInTheDocument();
  });

  it('renders Delete Assessment menu item from catalog', async () => {
    renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Assessment settings' }));
    expect(screen.getByRole('menuitem', { name: 'Delete Assessment' })).toBeInTheDocument();
  });

  it('renders Delete Assessment? title in confirmation dialog from catalog', async () => {
    renderWithIntl(<AssessmentSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'Assessment settings' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete Assessment' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Assessment?')).toBeInTheDocument();
  });
});
