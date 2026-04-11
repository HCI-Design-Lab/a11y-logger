import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const { mockPush, mockRefresh, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: mockRefresh }) }));
vi.mock('sonner', () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));
global.fetch = vi.fn();

import { ProjectSettingsMenu } from '../project-settings-menu';

const messages = {
  projects: {
    settings_menu: {
      aria_label: 'Project settings',
      add_assessment: 'Add Assessment',
      edit: 'Edit Project',
      delete: 'Delete Project',
    },
    delete_dialog: {
      title: 'Delete Project?',
      description:
        'This will permanently delete this project and all its assessments and issues. This cannot be undone.',
      confirm_button: 'Delete Project',
      cancel_button: 'Cancel',
    },
    toast: {
      deleted: 'Project deleted',
      delete_failed: 'Failed to delete project',
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

const props = { projectId: 'proj-1', projectName: 'Test Project' };

beforeEach(() => vi.clearAllMocks());

describe('ProjectSettingsMenu', () => {
  it('renders a settings trigger button', () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    expect(screen.getByRole('button', { name: /project settings/i })).toBeInTheDocument();
  });

  it('dropdown contains Add Assessment link', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    const item = screen.getByRole('menuitem', { name: /add assessment/i });
    expect(item).toHaveAttribute('href', '/projects/proj-1/assessments/new');
  });

  it('dropdown contains Edit Project link', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    const item = screen.getByRole('menuitem', { name: /edit project/i });
    expect(item).toHaveAttribute('href', '/projects/proj-1/edit');
  });

  it('dropdown contains Delete Project option', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    expect(screen.getByRole('menuitem', { name: /delete project/i })).toBeInTheDocument();
  });

  it('clicking Delete Project opens confirmation dialog', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete project/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirming delete calls DELETE /api/projects/proj-1 and redirects', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete project/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete project/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockPush).toHaveBeenCalledWith('/projects');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast and does not redirect when API returns failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Not found' }),
    });
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /project settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete project/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete project/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Not found');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

describe('i18n integration — real NextIntlClientProvider', () => {
  it('renders aria-label from translation catalog', () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    expect(screen.getByRole('button', { name: 'Project settings' })).toBeInTheDocument();
  });

  it('renders Edit Project menu item from catalog', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Project settings' }));
    expect(screen.getByRole('menuitem', { name: /edit project/i })).toBeInTheDocument();
  });

  it('renders Delete Project menu item from catalog', async () => {
    renderWithIntl(<ProjectSettingsMenu {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Project settings' }));
    expect(screen.getByRole('menuitem', { name: 'Delete Project' })).toBeInTheDocument();
  });
});
