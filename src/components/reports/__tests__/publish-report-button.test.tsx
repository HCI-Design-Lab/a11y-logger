import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { PublishReportButton } from '@/components/reports/publish-report-button';

const messages = {
  reports: {
    settings_menu: {
      aria_label: 'Report settings',
      edit: 'Edit Report',
      publish: 'Publish Report',
      unpublish: 'Unpublish Report',
      delete: 'Delete Report',
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

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

test('shows Publish button when not published', () => {
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={false} />);
  expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
});

test('shows Unpublish button when published', () => {
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={true} />);
  expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument();
});

test('clicking Publish opens confirmation dialog', () => {
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText(/make the report visible to stakeholders/i)).toBeInTheDocument();
});

test('confirmation dialog has Cancel and Publish action buttons', () => {
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeInTheDocument();
});

test('Unpublish button does NOT show a confirmation dialog', () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={true} />);
  fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('publish API is NOT called before confirmation', () => {
  global.fetch = vi.fn();
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(global.fetch).not.toHaveBeenCalled();
});

test('publish API is called after confirmation', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
  renderWithIntl(<PublishReportButton reportId="r1" isPublished={false} />);
  // Open dialog
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  // Click the confirm Publish action in the dialog
  const confirmButtons = screen.getAllByRole('button', { name: /^publish$/i });
  // The last Publish button is the action (in dialog)
  fireEvent.click(confirmButtons[confirmButtons.length - 1]!);
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/reports/r1/publish', { method: 'POST' });
  });
});
