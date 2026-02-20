import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { ReportForm } from '@/components/reports/report-form';

describe('ReportForm AI Generate Summary', () => {
  const mockReport = {
    id: 'r1',
    project_id: 'p1',
    title: 'Test Report',
    type: 'detailed' as const,
    status: 'draft' as const,
    content: '[]',
    template_id: null,
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Generate with AI button when editing a report', () => {
    render(<ReportForm report={mockReport} />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeInTheDocument();
  });

  it('shows loading state while generating summary', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<ReportForm report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { summary: 'AI generated summary.' } }),
    });
  });

  it('populates sections from AI-generated summary', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { summary: 'This project has several critical accessibility issues.' },
      }),
    } as Response);

    render(<ReportForm report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/generate-report-summary',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('r1'),
        })
      );
    });
  });

  it('shows error when AI is not configured', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        error: 'AI not configured',
        code: 'AI_NOT_CONFIGURED',
      }),
    } as Response);

    render(<ReportForm report={mockReport} />);
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
    });
  });
});
