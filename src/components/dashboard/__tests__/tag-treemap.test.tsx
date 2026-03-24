import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagTreemap } from '@/components/dashboard/tag-treemap';

// Mock Recharts — it uses browser APIs not available in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Treemap: () => <div data-testid="treemap-chart" />,
  Tooltip: () => null,
}));

const mockTags = [
  { tag: 'keyboard', count: 12 },
  { tag: 'color-contrast', count: 8 },
  { tag: 'aria', count: 5 },
];

function mockFetchSuccess(data: typeof mockTags) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data }),
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

function mockFetchReject() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('TagTreemap', () => {
  it('shows "Loading…" while fetch has not resolved', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    );
    render(<TagTreemap />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "Failed to load data." when fetch returns a non-ok response', async () => {
    mockFetchError();
    render(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeInTheDocument();
    });
  });

  it('shows "Failed to load data." when fetch rejects', async () => {
    mockFetchReject();
    render(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeInTheDocument();
    });
  });

  it('shows "No tags found." when API returns an empty array', async () => {
    mockFetchSuccess([]);
    render(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('No tags found.')).toBeInTheDocument();
    });
  });

  it('renders the treemap chart container when data exists and view is chart', async () => {
    mockFetchSuccess(mockTags);
    render(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByTestId('treemap-chart')).toBeInTheDocument();
    });
  });

  it('renders a table with correct rows and percentage calculations in table view', async () => {
    mockFetchSuccess(mockTags);
    render(<TagTreemap />);

    // Wait for data to load, then switch to table view
    await waitFor(() => {
      expect(screen.getByTestId('treemap-chart')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));

    // Table headers
    expect(screen.getByText('Tag')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('% of Total')).toBeInTheDocument();

    // Tag names
    expect(screen.getByText('keyboard')).toBeInTheDocument();
    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('aria')).toBeInTheDocument();

    // Counts
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Percentages: total = 25, keyboard=48%, color-contrast=32%, aria=20%
    expect(screen.getByText('48%')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});
