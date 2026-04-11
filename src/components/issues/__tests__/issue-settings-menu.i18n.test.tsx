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

test('renders settings trigger button with translated aria-label', () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  expect(screen.getByRole('button', { name: /issue settings/i })).toBeInTheDocument();
});

test('dropdown contains translated Edit Issue link', async () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  expect(await screen.findByRole('menuitem', { name: /edit issue/i })).toBeInTheDocument();
});

test('dropdown contains translated Delete Issue item', async () => {
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  expect(await screen.findByRole('menuitem', { name: /delete issue/i })).toBeInTheDocument();
});

test('translated delete toast is shown on successful delete', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<IssueSettingsMenu {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: /issue settings/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete issue/i }));
  await userEvent.click(await screen.findByRole('button', { name: /delete issue/i }));
  await vi.waitFor(() => {
    expect(mockToastSuccess).toHaveBeenCalledWith('Issue deleted');
  });
});

test('renders aria-label from translations (locale test)', () => {
  const frMessages = {
    issues: {
      settings_menu: {
        aria_label: 'Paramètres du problème',
        edit: 'Modifier le problème',
        delete: 'Supprimer le problème',
        mark_in_progress: 'Marquer en cours',
        mark_complete: 'Marquer comme terminé',
        mark_open: 'Marquer comme ouvert',
      },
      delete_dialog: {
        title: 'Supprimer {name} ?',
        description: 'Cela supprimera définitivement ce problème.',
        confirm_button: 'Supprimer le problème',
        cancel_button: 'Annuler',
      },
      toast: {
        created: 'Problème créé',
        updated: 'Problème mis à jour',
        deleted: 'Problème supprimé',
        imported: 'Problèmes importés',
        create_failed: 'Échec',
        update_failed: 'Échec',
        delete_failed: 'Échec de la suppression du problème',
        import_failed: 'Échec',
      },
    },
  };
  render(
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      <IssueSettingsMenu {...defaultProps} />
    </NextIntlClientProvider>
  );
  expect(screen.getByRole('button', { name: /Paramètres du problème/i })).toBeInTheDocument();
});
