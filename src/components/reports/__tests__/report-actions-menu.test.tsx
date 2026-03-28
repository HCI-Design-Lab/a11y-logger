import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

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
    render(<ReportActionsMenu {...defaultProps} />);
    expect(screen.getByRole('button', { name: /report actions/i })).toBeInTheDocument();
  });

  it('shows Edit option when draft', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
  });

  it('hides Edit option when published', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('shows Publish option when draft', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('shows Unpublish option when published', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('shows Delete option', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/delete report/i)).toBeInTheDocument();
  });

  it('opens publish confirmation dialog when Publish is clicked', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/publish report/i)).toBeInTheDocument();
  });

  it('renders export links in the dropdown', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /html.*default/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /word/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /print/i })).toBeInTheDocument();
  });

  // Async action tests

  it('publish confirm — success: calls API, shows success toast, refreshes router', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
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
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
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
    render(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
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
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^delete$/i }));
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
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('DB error');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
