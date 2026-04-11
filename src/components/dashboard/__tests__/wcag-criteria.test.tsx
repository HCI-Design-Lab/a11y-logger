import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';

const messages = {
  dashboard: {
    wcag_criteria: {
      title: 'WCAG Criteria',
      subtitle: 'Filtered by principle',
      loading: 'Loading…',
      error: 'Failed to load WCAG criteria.',
      empty: 'No issues logged for {principle} criteria yet.',
      tooltip_issues: 'Issues',
    },
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

const mockCriteriaData = [
  { code: '1.1.1', name: 'Non-text Content', count: 12 },
  { code: '1.4.3', name: 'Contrast (Minimum)', count: 5 },
];

function mockFetch(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: async () => data,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WcagCriteria', () => {
  it('shows loading state on mount', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no criteria data', async () => {
    mockFetch({ success: true, data: [] });
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    await waitFor(() =>
      expect(screen.getByText(/No issues logged for Perceivable criteria yet/)).toBeInTheDocument()
    );
  });

  it('shows error state when API fails', async () => {
    mockFetch({ success: false, error: 'DB error' });
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    await waitFor(() =>
      expect(screen.getByText('Failed to load WCAG criteria.')).toBeInTheDocument()
    );
  });

  it('renders criteria rows with code, name, and count', async () => {
    mockFetch({ success: true, data: mockCriteriaData });
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    await waitFor(() => expect(screen.getByText('1.1.1')).toBeInTheDocument());
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('1.4.3')).toBeInTheDocument();
    expect(screen.getByText('Contrast (Minimum)')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has four principle tabs defaulting to Perceivable', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    ['Perceivable', 'Operable', 'Understandable', 'Robust'].forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'Perceivable' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('switches active principle when tab is clicked', async () => {
    mockFetch({ success: true, data: [] });
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    await waitFor(() => screen.getByText(/No issues logged/));
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Operable' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Operable' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Perceivable' })).toHaveAttribute(
        'data-state',
        'inactive'
      );
    });
  });

  it('includes statuses in fetch URL', async () => {
    mockFetch({ success: true, data: [] });
    renderWithIntl(<WcagCriteria statuses={['open', 'resolved']} />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('statuses=open,resolved'));
    });
  });
});
