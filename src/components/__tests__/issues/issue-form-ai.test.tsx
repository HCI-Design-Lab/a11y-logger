import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';

describe('IssueForm AI Generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Generate with AI button', () => {
    render(<IssueForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeInTheDocument();
  });

  it('Generate with AI button is disabled when ai description is empty', () => {
    render(<IssueForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeDisabled();
  });

  it('shows loading state while AI is fetching', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<IssueForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'The search button is not keyboard accessible' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          title: 'Search button not keyboard accessible',
          description: 'The search button cannot be reached via keyboard',
          severity: 'high',
          user_impact: 'Keyboard-only users cannot use search',
          suggested_fix: 'Add tabindex="0" and keyboard event handlers',
          wcag_codes: ['2.1.1'],
        },
      }),
    });
  });

  it('pre-populates fields from AI suggestion', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          title: 'Search button not keyboard accessible',
          description: 'The search button cannot be reached via keyboard',
          severity: 'high',
          user_impact: 'Keyboard-only users cannot use search',
          suggested_fix: 'Add tabindex and keyboard handlers',
          wcag_codes: ['2.1.1'],
        },
      }),
    } as Response);

    render(<IssueForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'The search button is not keyboard accessible on the homepage' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Search button not keyboard accessible');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ai/generate-issue',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(
          'The search button is not keyboard accessible on the homepage'
        ),
      })
    );
  });

  it('shows error message when AI is not configured', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        error: 'AI not configured',
        code: 'AI_NOT_CONFIGURED',
      }),
    } as Response);

    render(<IssueForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'Some issue description' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
    });
  });

  it('does not call fetch when ai description is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<IssueForm onSubmit={vi.fn()} />);

    // AI description is empty — click Generate with AI
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
