import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { IssueForm } from '@/components/issues/issue-form';

// Lightweight mocks: render only badges for selected codes (no 80+ checkbox lists).
// Tests that verify AI-populated values can still find badge text in the DOM.
vi.mock('@/components/issues/wcag-selector', () => ({
  WcagSelector: ({ selected }: { selected: string[] }) =>
    selected.length > 0 ? (
      <div>{selected.map((code: string) => <span key={code}>{code}</span>)}</div>
    ) : null,
}));
vi.mock('@/components/issues/section508-selector', () => ({
  Section508Selector: ({ selected }: { selected: string[] }) =>
    selected.length > 0 ? (
      <div>{selected.map((code: string) => <span key={code}>{code}</span>)}</div>
    ) : null,
}));
vi.mock('@/components/issues/eu-selector', () => ({
  EuSelector: ({ selected }: { selected: string[] }) =>
    selected.length > 0 ? (
      <div>{selected.map((code: string) => <span key={code}>{code}</span>)}</div>
    ) : null,
}));
vi.mock('@/components/issues/tag-input', () => ({
  TagInput: () => null,
}));

describe('IssueForm AI Generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Generate with AI button', () => {
    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeInTheDocument();
  });

  it('Generate with AI button is disabled when ai description is empty', () => {
    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeDisabled();
  });

  it('shows loading state while AI is fetching', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'The search button is not keyboard accessible' },
    });

    // setAiLoading(true) is called synchronously before the first await in handleAiGenerate,
    // so fireEvent.click (which wraps in act) flushes it before returning.
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();

    // Resolve the pending fetch so the component can fully clean up.
    await act(async () => {
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
  }, 15000);

  it('pre-populates fields from AI suggestion', async () => {
    const onSubmit = vi.fn();
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

    render(<IssueForm onSubmit={onSubmit} projectId="p1" />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'The search button is not keyboard accessible on the homepage' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    // WcagSelector is a Controller-backed component that re-renders with the new value,
    // making the code visible as text — a reliable signal that AI data was applied.
    await waitFor(() => {
      expect(screen.getByText('2.1.1')).toBeInTheDocument();
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

    // Submit the form to confirm RHF internal state was updated with the AI title.
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Search button not keyboard accessible' }),
        expect.anything()
      );
    });
  }, 20000);

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

    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'Some issue description' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
    });
  }, 15000);

  it('does not call fetch when ai description is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);

    // AI description is empty — click Generate with AI
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('populates section_508_codes from AI response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          title: 'Button not accessible',
          description: 'The button is not accessible',
          severity: 'high',
          user_impact: null,
          suggested_fix: null,
          wcag_codes: [],
          section_508_codes: ['302.1'],
          eu_codes: [],
        },
      }),
    } as Response);

    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'Button is not accessible' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByText('302.1')).toBeInTheDocument();
    });
  }, 15000);

  it('populates eu_codes from AI response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          title: 'Button not accessible',
          description: 'The button is not accessible',
          severity: 'high',
          user_impact: null,
          suggested_fix: null,
          wcag_codes: [],
          section_508_codes: [],
          eu_codes: ['4.2.1'],
        },
      }),
    } as Response);

    render(<IssueForm onSubmit={vi.fn()} projectId="p1" />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'Button is not accessible' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => {
      expect(screen.getByText('4.2.1')).toBeInTheDocument();
    });
  }, 15000);
});
