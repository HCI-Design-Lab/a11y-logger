import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityChart } from '@/components/dashboard/activity-chart';

const messages = {
  dashboard: {
    activity_chart: {
      title: 'Projects, Assessments, and Issues',
      loading: 'Loading…',
      error: 'Failed to load chart data.',
      empty: 'No activity in this period.',
      range_6m: '6 months',
      range_3m: '3 months',
      range_1m: '1 month',
      range_1w: '1 week',
      table_showing_weeks: 'Showing most recent {count} weeks',
      table_showing_days: 'Showing most recent {count} days',
      col_date: 'Date',
      col_projects: 'Projects',
      col_assessments: 'Assessments',
      col_issues: 'Issues',
      caption: 'Projects, assessments, and issues created over time',
      line_projects: 'Projects',
      line_assessments: 'Assessments',
      line_issues: 'Issues',
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
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockTimeSeriesData = [
  { date: '2026-01-01', projects: 1, assessments: 2, issues: 5 },
  { date: '2026-01-15', projects: 2, assessments: 3, issues: 8 },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ActivityChart', () => {
  it('shows loading state on mount', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithIntl(<ActivityChart />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when API returns no data', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() =>
      expect(screen.getByText('No activity in this period.')).toBeInTheDocument()
    );
  });

  it('shows error state when API fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: false, error: 'DB error' }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.getByText('Failed to load chart data.')).toBeInTheDocument());
  });

  it('renders the chart container when data is present', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: mockTimeSeriesData }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    // Should show the date range subtitle
    expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
  });

  it('has four time range buttons with aria-pressed', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderWithIntl(<ActivityChart />);
    const labels = ['6 months', '3 months', '1 month', '1 week'];
    labels.forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    });
    // Default is 6m
    expect(screen.getByRole('tab', { name: '6 months' })).toHaveAttribute('data-state', 'active');
  });

  it('changes active range button when clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => screen.getByText('No activity in this period.'));
    fireEvent.mouseDown(screen.getByRole('tab', { name: '1 week' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '1 week' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: '6 months' })).toHaveAttribute(
        'data-state',
        'inactive'
      );
    });
  });

  it('shows table view with column headers when table toggle is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: mockTimeSeriesData }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Assessments')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('shows "weeks" label in table view for 6-month range', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: mockTimeSeriesData }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByText(/weeks/i)).toBeInTheDocument();
  });

  it('shows "days" label in table view for 1-week range', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: mockTimeSeriesData }),
    });
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole('tab', { name: '1 week' }));
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByText(/days/i)).toBeInTheDocument();
  });

  it('shows error state when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderWithIntl(<ActivityChart />);
    await waitFor(() => expect(screen.getByText('Failed to load chart data.')).toBeInTheDocument());
  });

  it('groups entries by week for 3m range', async () => {
    // Two entries in the same week (Mon + Wed of the same week)
    const sameWeekData = [
      { date: '2026-01-05', projects: 1, assessments: 1, issues: 2 }, // Monday
      { date: '2026-01-07', projects: 0, assessments: 1, issues: 3 }, // Wednesday same week
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true, data: sameWeekData }),
    });
    renderWithIntl(<ActivityChart />);
    // Switch to 3m so bucketing applies
    fireEvent.mouseDown(screen.getByRole('tab', { name: '3 months' }));
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    // Two entries bucketed into one week row — only one date row should appear
    const rows = screen.getAllByText(/2026-01-/);
    expect(rows).toHaveLength(1);
  });
});
