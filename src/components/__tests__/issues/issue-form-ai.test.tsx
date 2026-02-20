import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';

describe('IssueForm AI Suggest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the AI Suggest button', () => {
    render(<IssueForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ai suggest/i })).toBeInTheDocument();
  });

  it('shows loading state while AI is fetching', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<IssueForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Image missing alt text' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ai suggest/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /suggesting/i })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { codes: ['1.1.1'], confidence: 0.9 } }),
    });
  });

  it('pre-populates WCAG codes from AI suggestion', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { codes: ['1.1.1', '1.4.3'], confidence: 0.87 },
      }),
    } as Response);

    render(<IssueForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Image missing alt text' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'No alt attribute on img element' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ai suggest/i }));

    await waitFor(() => {
      expect(screen.getByText(/87% confidence/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ai/suggest-wcag',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Image missing alt text'),
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
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Some issue' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ai suggest/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
    });
  });

  it('does not call fetch when title is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<IssueForm onSubmit={vi.fn()} />);

    // Title is empty — click AI Suggest
    fireEvent.click(screen.getByRole('button', { name: /ai suggest/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
