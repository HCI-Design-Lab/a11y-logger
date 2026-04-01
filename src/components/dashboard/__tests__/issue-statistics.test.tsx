import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Tooltip: () => null,
}));

const mockData = {
  breakdown: { critical: 2, high: 3, medium: 1, low: 0 },
  total: 6,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IssueStatistics subtitle', () => {
  it('shows "Open" subtitle when statuses is [open]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Issue Statistics')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows "Resolved" subtitle when statuses is [resolved]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['resolved']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('shows "Won\'t Fix" subtitle when statuses is [wont_fix]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['wont_fix']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText("Won't Fix")).toBeInTheDocument();
  });

  it('shows combined label when multiple statuses selected', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open', 'resolved']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Open · Resolved')).toBeInTheDocument();
  });
});

describe('IssueStatistics chart center label', () => {
  it('shows "Issues" in chart center', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });
});

describe('IssueStatistics behavioral tests', () => {
  it('shows loading indicator while fetch is pending', async () => {
    // Never resolve so we stay in the loading state
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<IssueStatistics statuses={['open']} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error message when fetch returns non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('Failed to load data.')).toBeInTheDocument());
  });

  it('switches from chart to table view when table toggle is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

    const tableToggle = screen.getByRole('button', { name: /table view/i });
    expect(tableToggle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(tableToggle);
    expect(tableToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays correct severity counts in table view', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /table view/i }));

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Critical=2, High=3, Medium=1, Low=0 per mockData
    const rows = screen.getAllByRole('row');
    // rows[0] is the header row
    const criticalRow = rows.find((r) => r.textContent?.includes('Critical'));
    const highRow = rows.find((r) => r.textContent?.includes('High'));
    const mediumRow = rows.find((r) => r.textContent?.includes('Medium'));
    const lowRow = rows.find((r) => r.textContent?.includes('Low'));

    expect(criticalRow?.textContent).toMatch(/2/);
    expect(highRow?.textContent).toMatch(/3/);
    expect(mediumRow?.textContent).toMatch(/1/);
    expect(lowRow?.textContent).toMatch(/0/);
  });

  it('appends projectId to fetch URL when projectId prop is provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} projectId="proj-123" />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('projectId=proj-123'),
      expect.any(Object)
    );
  });

  it('does not show error message when fetch throws an AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(abortError);
    render(<IssueStatistics statuses={['open']} />);
    // Give the promise time to reject and the component to potentially update
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.queryByText('Failed to load data.')).not.toBeInTheDocument();
  });

  it('renders stale data at opacity-50 while refetching after statuses change', async () => {
    // First fetch resolves with data
    let resolveSecond!: (value: unknown) => void;
    const secondFetchPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    const fetchMock = (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      })
      .mockReturnValueOnce(secondFetchPromise);

    const { rerender } = render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

    // Trigger a re-fetch by changing statuses prop — second fetch is still pending
    rerender(<IssueStatistics statuses={['resolved']} />);

    // The stale data container should now have opacity-50 while the new fetch is in flight
    await waitFor(() => {
      const staleContainer = document.querySelector('.opacity-50');
      expect(staleContainer).toBeInTheDocument();
    });

    // Resolve the second fetch to clean up, wrapped in act so React can flush state updates
    await act(async () => {
      resolveSecond({
        ok: true,
        json: async () => ({ data: mockData }),
      });
      await new Promise((r) => setTimeout(r, 0));
    });

    // Suppress unused variable warning — fetchMock is checked implicitly via fetch calls
    void fetchMock;
  });
});
