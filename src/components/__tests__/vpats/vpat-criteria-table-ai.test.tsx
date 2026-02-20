import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import type { CriterionRow } from '@/components/vpats/vpat-criteria-table';

const mockCriteria: CriterionRow[] = [
  {
    criterion_code: '1.1.1',
    conformance: 'supports',
    remarks: null,
    related_issue_ids: [],
  },
  {
    criterion_code: '1.3.1',
    conformance: 'does_not_support',
    remarks: 'Heading structure is broken',
    related_issue_ids: [],
  },
];

describe('VpatCriteriaTable AI Generate Narrative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI Generate buttons for each criterion when projectId is provided', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} projectId="p1" />);
    const aiButtons = screen.getAllByRole('button', { name: /ai generate/i });
    expect(aiButtons.length).toBeGreaterThan(0);
  });

  it('does not render AI Generate buttons without projectId', () => {
    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} />);
    expect(screen.queryAllByRole('button', { name: /ai generate/i })).toHaveLength(0);
  });

  it('shows loading state while generating narrative', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(global, 'fetch').mockReturnValueOnce(fetchPromise as Promise<Response>);

    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} projectId="p1" />);

    const aiButtons = screen.getAllByRole('button', { name: /ai generate/i });
    fireEvent.click(aiButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating narrative for/i })).toBeDisabled();
    });

    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: { narrative: 'Fully supports non-text content alternatives.' },
      }),
    });
  });

  it('calls onChange with updated remarks after AI generates narrative', async () => {
    const onChange = vi.fn();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { narrative: 'Fully supports non-text content alternatives.' },
      }),
    } as Response);

    render(<VpatCriteriaTable criteria={mockCriteria} onChange={onChange} projectId="p1" />);

    const aiButtons = screen.getAllByRole('button', { name: /ai generate/i });
    fireEvent.click(aiButtons[0]);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            criterion_code: '1.1.1',
            remarks: 'Fully supports non-text content alternatives.',
          }),
        ])
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ai/generate-vpat-narrative',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('1.1.1'),
      })
    );
  });

  it('shows error when AI narrative generation fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        error: 'AI not configured',
        code: 'AI_NOT_CONFIGURED',
      }),
    } as Response);

    render(<VpatCriteriaTable criteria={mockCriteria} onChange={vi.fn()} projectId="p1" />);

    const aiButtons = screen.getAllByRole('button', { name: /ai generate/i });
    fireEvent.click(aiButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
    });
  });
});
