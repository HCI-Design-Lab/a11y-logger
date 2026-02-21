import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { PublishReportButton } from '@/components/reports/publish-report-button';

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
  render(<PublishReportButton reportId="r1" isPublished={false} />);
  expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
});

test('shows Unpublish button when published', () => {
  render(<PublishReportButton reportId="r1" isPublished={true} />);
  expect(screen.getByRole('button', { name: /unpublish/i })).toBeInTheDocument();
});

test('clicking Publish opens confirmation dialog', () => {
  render(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText(/once published.*cannot be edited/i)).toBeInTheDocument();
});

test('confirmation dialog has Cancel and Publish action buttons', () => {
  render(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeInTheDocument();
});

test('Unpublish button does NOT show a confirmation dialog', () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
  render(<PublishReportButton reportId="r1" isPublished={true} />);
  fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('publish API is NOT called before confirmation', () => {
  global.fetch = vi.fn();
  render(<PublishReportButton reportId="r1" isPublished={false} />);
  fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));
  expect(global.fetch).not.toHaveBeenCalled();
});

test('publish API is called after confirmation', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
  render(<PublishReportButton reportId="r1" isPublished={false} />);
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
