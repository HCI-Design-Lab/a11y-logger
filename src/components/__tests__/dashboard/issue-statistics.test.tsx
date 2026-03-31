import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

// Mock Recharts — it uses browser APIs not available in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}));

const mockData = {
  breakdown: { critical: 4, high: 18, medium: 10, low: 3 },
  total: 35,
};

function mockFetchSuccess(data: typeof mockData) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data }),
    })
  );
}

function mockFetchError() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    })
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('IssueStatistics', () => {
  it('shows "Loading…" while fetch has not resolved', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    );
    render(<IssueStatistics statuses={['open']} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "Failed to load data." when fetch returns a non-ok response', async () => {
    mockFetchError();
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeInTheDocument();
    });
  });

  it('renders chart view with total when data loads', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument();
    });
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('renders all four severity labels in chart view', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders chart view by default (chart toggle button is pressed)', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument();
    });
    const chartButton = screen.getByRole('button', { name: 'Chart view' });
    expect(chartButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to table view when table toggle is clicked', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument();
    });
    const tableButton = screen.getByRole('button', { name: 'Table view' });
    fireEvent.click(tableButton);
    expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('table view shows correct severity counts', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByText('4')).toBeInTheDocument(); // critical
    expect(screen.getByText('18')).toBeInTheDocument(); // high
    expect(screen.getByText('10')).toBeInTheDocument(); // medium
    expect(screen.getByText('3')).toBeInTheDocument(); // low
  });

  it('appends projectId to fetch URL when provided', async () => {
    mockFetchSuccess(mockData);
    render(<IssueStatistics statuses={['open']} projectId="proj-1" />);
    await waitFor(() => expect(screen.getByText('35')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('projectId=proj-1'),
      expect.anything()
    );
  });

  it('does not show error when fetch is aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    );
    render(<IssueStatistics statuses={['open']} />);
    // Give the microtask queue time to flush
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Failed to load data.')).not.toBeInTheDocument();
  });

  it('shows stale data at reduced opacity while refetching', async () => {
    // First render resolves with data
    mockFetchSuccess(mockData);
    const { rerender } = render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('35')).toBeInTheDocument());

    // Switch statuses with a pending fetch so loading=true but fetchedData still exists
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    rerender(<IssueStatistics statuses={['resolved']} />);
    // The wrapper div gets opacity-50 while new fetch is pending
    const opacityDiv = document.querySelector('.opacity-50');
    expect(opacityDiv).not.toBeNull();
  });
});
