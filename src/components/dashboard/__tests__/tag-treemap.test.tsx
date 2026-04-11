import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { TagTreemap } from '@/components/dashboard/tag-treemap';

const messages = {
  dashboard: {
    tag_treemap: {
      title: 'Issue Tags',
      subtitle: 'Open issues by tag frequency',
      loading: 'Loading…',
      error: 'Failed to load data.',
      empty: 'No tags found.',
      col_tag: 'Tag',
      col_issues: 'Issues',
      col_percent: '% of Total',
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

// Mock Recharts — it uses browser APIs not available in jsdom.
// The Treemap mock calls the `content` prop so CustomContent branches get exercised.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Treemap: ({
    content,
    data,
  }: {
    content: React.ReactElement<Record<string, unknown>>;
    data: { name: string; size: number }[];
  }) => {
    const cells = (data ?? []).map((entry: { name: string; size: number }, i: number) =>
      React.cloneElement(content, {
        key: i,
        x: 10,
        y: 10,
        width: 100,
        height: 60,
        name: entry.name,
        size: entry.size,
        index: i,
      })
    );
    return <div data-testid="treemap-chart">{cells}</div>;
  },
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
    renderWithIntl(<TagTreemap />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows "Failed to load data." when fetch returns a non-ok response', async () => {
    mockFetchError();
    renderWithIntl(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeInTheDocument();
    });
  });

  it('shows "Failed to load data." when fetch rejects', async () => {
    mockFetchReject();
    renderWithIntl(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeInTheDocument();
    });
  });

  it('shows "No tags found." when API returns an empty array', async () => {
    mockFetchSuccess([]);
    renderWithIntl(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByText('No tags found.')).toBeInTheDocument();
    });
  });

  it('renders the treemap chart container when data exists and view is chart', async () => {
    mockFetchSuccess(mockTags);
    renderWithIntl(<TagTreemap />);
    await waitFor(() => {
      expect(screen.getByTestId('treemap-chart')).toBeInTheDocument();
    });
  });

  it('renders a table with correct rows and percentage calculations in table view', async () => {
    mockFetchSuccess(mockTags);
    renderWithIntl(<TagTreemap />);

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
