import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PourRadar } from '@/components/dashboard/pour-radar';

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
}));

function mockFetch(data: unknown, ok = true) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok,
    json: async () => data,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const nonZeroData = { perceivable: 5, operable: 3, understandable: 2, robust: 1 };

describe('PourRadar', () => {
  it('shows loading state on mount', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<PourRadar statuses={['open']} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error state when fetch returns non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });
    render(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('Failed to load data.')).toBeInTheDocument());
  });

  it('shows error state when fetch rejects (network error)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));
    render(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('Failed to load data.')).toBeInTheDocument());
  });

  it('shows empty state when all POUR totals are zero', async () => {
    mockFetch({
      success: true,
      data: { perceivable: 0, operable: 0, understandable: 0, robust: 0 },
    });
    render(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('No open issues found.')).toBeInTheDocument());
  });

  it('renders chart container when data has non-zero totals', async () => {
    mockFetch({ success: true, data: nonZeroData });
    render(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByTestId('radar-chart')).toBeInTheDocument());
  });

  it('includes statuses in fetch URL', async () => {
    mockFetch({ success: true, data: nonZeroData });
    render(<PourRadar statuses={['open', 'resolved']} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('statuses=open,resolved'));
    });
  });
});
