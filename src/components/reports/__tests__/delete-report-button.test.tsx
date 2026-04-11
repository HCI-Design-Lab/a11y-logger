import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { DeleteReportButton } from '@/components/reports/delete-report-button';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const messages = {
  reports: {
    delete_dialog: {
      title: 'Delete {name}?',
      description: 'This will permanently delete this report. This cannot be undone.',
      confirm_button: 'Delete Report',
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

beforeEach(() => {
  vi.resetAllMocks();
});

test('renders Delete trigger button', () => {
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('opens confirmation dialog on click', () => {
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});

test('dialog title includes report name', () => {
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(screen.getByText(/delete my report/i)).toBeInTheDocument();
});

test('dialog description renders from translations', () => {
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(screen.getByText(/this will permanently delete this report/i)).toBeInTheDocument();
});

test('dialog confirm button renders from translations', () => {
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  // confirm button in dialog has text "Delete Report"
  const buttons = screen.getAllByRole('button', { name: /delete report/i });
  expect(buttons.length).toBeGreaterThan(0);
});

test('calls API and shows success toast on delete', async () => {
  const { toast } = await import('sonner');
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });
  renderWithIntl(<DeleteReportButton reportId="r1" reportTitle="My Report" />);
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  // click the confirm button in dialog
  const confirmBtn = screen
    .getAllByRole('button')
    .find((b) => b.textContent?.toLowerCase().includes('delete report'));
  fireEvent.click(confirmBtn!);
  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Report deleted');
  });
});
