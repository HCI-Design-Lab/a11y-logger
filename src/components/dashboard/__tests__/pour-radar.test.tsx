import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PourRadar } from '@/components/dashboard/pour-radar';

const messages = {
  dashboard: {
    pour_radar: {
      title: 'Issues by POUR Principle',
      loading: 'Loading…',
      error: 'Failed to load data.',
      empty: 'No open issues found.',
      col_principle: 'Principle',
      col_issues: 'Issues',
      col_percent: '% of Total',
      row_total: 'Total',
      caption: 'Issues by POUR Principle — open issues only',
      principle_perceivable: 'Perceivable',
      principle_operable: 'Operable',
      principle_understandable: 'Understandable',
      principle_robust: 'Robust',
    },
    chart_table_toggle: {
      group_aria_label: 'View toggle',
      chart_aria_label: 'Chart view',
      table_aria_label: 'Table view',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

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
    renderWithIntl(<PourRadar statuses={['open']} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error state when fetch returns non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });
    renderWithIntl(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('Failed to load data.')).toBeInTheDocument());
  });

  it('shows error state when fetch rejects (network error)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));
    renderWithIntl(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('Failed to load data.')).toBeInTheDocument());
  });

  it('shows empty state when all POUR totals are zero', async () => {
    mockFetch({
      success: true,
      data: { perceivable: 0, operable: 0, understandable: 0, robust: 0 },
    });
    renderWithIntl(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('No open issues found.')).toBeInTheDocument());
  });

  it('renders chart container when data has non-zero totals', async () => {
    mockFetch({ success: true, data: nonZeroData });
    renderWithIntl(<PourRadar statuses={['open']} />);
    await waitFor(() => expect(screen.getByTestId('radar-chart')).toBeInTheDocument());
  });

  it('includes statuses in fetch URL', async () => {
    mockFetch({ success: true, data: nonZeroData });
    renderWithIntl(<PourRadar statuses={['open', 'resolved']} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('statuses=open,resolved'));
    });
  });
});
