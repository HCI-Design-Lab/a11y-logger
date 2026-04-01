import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="rich-text-editor" data-placeholder={placeholder} />
  ),
}));

import { ReportEditForm } from '@/components/reports/report-edit-form';

const mockReport = {
  id: 'r1',
  title: 'My Report',
  status: 'draft' as const,
  content: '{}',
  type: 'detailed' as const,
  assessment_ids: ['a1'],
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('ReportEditForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders section placeholder cards when content is empty', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    expect(screen.getByText(/add executive summary/i)).toBeInTheDocument();
    expect(screen.getByText(/add top risks/i)).toBeInTheDocument();
    expect(screen.getByText(/add quick wins/i)).toBeInTheDocument();
    expect(screen.getByText(/add user impact/i)).toBeInTheDocument();
  });

  it('expands executive summary section when + clicked', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('shows delete modal when trash icon clicked', async () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText(/permanently remove/i)).toBeInTheDocument();
    });
  });

  it('removes section after delete confirmed', async () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => screen.getByText(/permanently remove/i));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.getByText(/add executive summary/i)).toBeInTheDocument();
    });
  });

  it('renders Save Report button', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    expect(screen.getByRole('button', { name: /save report/i })).toBeInTheDocument();
  });

  it('shows error toast when save fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Server error' }),
    } as Response);

    const { toast } = await import('sonner');
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /save report/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('disables save button while saving', async () => {
    let resolvePromise: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(pending);

    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /save report/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    // Resolve to clean up
    resolvePromise!({ json: async () => ({ success: true, data: {} }) } as Response);
  });

  it('adds Top Risks section when placeholder is clicked', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add top risks/i));
    expect(screen.getByText('Top Risks')).toBeInTheDocument();
  });

  it('adds Quick Wins section when placeholder is clicked', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add quick wins/i));
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
  });

  it('adds User Impact section when placeholder is clicked', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add user impact/i));
    expect(screen.getByText('Screen Reader User')).toBeInTheDocument();
  });

  it('renders Cancel link pointing to report detail', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/reports/r1');
  });

  it('closes delete modal when cancel is clicked', async () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => screen.getByText(/permanently remove/i));

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/permanently remove/i)).not.toBeInTheDocument();
    });
  });
});
