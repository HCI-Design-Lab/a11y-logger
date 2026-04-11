import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const { mockPush, mockRefresh, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

global.fetch = vi.fn();

import { ReportActionsMenu } from '../report-actions-menu';

const messages = {
  reports: {
    settings_menu: {
      aria_label: 'Report settings',
      edit: 'Edit Report',
      publish: 'Publish Report',
      unpublish: 'Unpublish Report',
      delete: 'Delete Report',
    },
    delete_dialog: {
      title: 'Delete {name}?',
      description: 'This will permanently delete this report. This cannot be undone.',
      confirm_button: 'Delete Report',
      cancel_button: 'Cancel',
    },
    publish_dialog: {
      title: 'Publish Report?',
      description: 'This will make the report visible to stakeholders.',
      confirm_button: 'Publish',
      cancel_button: 'Cancel',
    },
    toast: {
      created: 'Report created',
      updated: 'Report updated',
      deleted: 'Report deleted',
      published: 'Report published',
      unpublished: 'Report unpublished',
      create_failed: 'Failed to create report',
      update_failed: 'Failed to update report',
      delete_failed: 'Failed to delete report',
      publish_failed: 'Failed to publish report',
      unpublish_failed: 'Failed to unpublish report',
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
  reportId: 'report-1',
  reportTitle: 'Test Report',
  isPublished: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportActionsMenu', () => {
  it('renders a settings trigger button', () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    expect(screen.getByRole('button', { name: /report settings/i })).toBeInTheDocument();
  });

  it('shows Edit option when draft', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
  });

  it('hides Edit option when published', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('shows Publish option when draft', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('shows Unpublish option when published', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.getByRole('menuitem', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('shows Delete option', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/delete report/i)).toBeInTheDocument();
  });

  it('opens publish confirmation dialog when Publish is clicked', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/publish report/i)).toBeInTheDocument();
  });

  it('renders export links in the dropdown', async () => {
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    expect(screen.getByRole('menuitem', { name: /html.*default/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /word/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /print/i })).toBeInTheDocument();
  });

  // Async action tests

  it('publish confirm — success: calls API, shows success toast, refreshes router', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^publish$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/report-1/publish',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Report published');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('publish confirm — API error: shows error toast', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Server error' }),
    });
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^publish$/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Server error');
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('unpublish — success: calls API with DELETE, shows success toast, refreshes router', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    renderWithIntl(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /unpublish/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/report-1/publish',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Report unpublished');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('delete confirm — success: calls API with DELETE, shows success toast, navigates to /reports', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^delete report$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/report-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Report deleted');
    expect(mockPush).toHaveBeenCalledWith('/reports');
  });

  it('delete confirm — API error: shows error toast', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'DB error' }),
    });
    renderWithIntl(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^delete report$/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('DB error');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
