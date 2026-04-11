/**
 * i18n integration tests for dashboard components.
 * Each component is wrapped in NextIntlClientProvider and tested to ensure
 * strings come from translation keys rather than being hardcoded.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { ChartTableToggle } from '@/components/dashboard/chart-table-toggle';
import { EnvironmentHeatmap } from '@/components/dashboard/environment-heatmap';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { PourRadar } from '@/components/dashboard/pour-radar';
import { RepeatOffenders } from '@/components/dashboard/repeat-offenders';
import { StatusFilter } from '@/components/dashboard/status-filter';
import { TagTreemap } from '@/components/dashboard/tag-treemap';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  Treemap: () => <div data-testid="treemap-chart" />,
}));

const messages = {
  dashboard: {
    activity_chart: {
      title: 'TRANSLATED: Projects, Assessments, and Issues',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load chart data.',
      empty: 'TRANSLATED: No activity in this period.',
      range_6m: 'TRANSLATED: 6 months',
      range_3m: 'TRANSLATED: 3 months',
      range_1m: 'TRANSLATED: 1 month',
      range_1w: 'TRANSLATED: 1 week',
      table_showing_weeks: 'TRANSLATED: Showing most recent {count} weeks',
      table_showing_days: 'TRANSLATED: Showing most recent {count} days',
      col_date: 'TRANSLATED: Date',
      col_projects: 'TRANSLATED: Projects',
      col_assessments: 'TRANSLATED: Assessments',
      col_issues: 'TRANSLATED: Issues',
      caption: 'TRANSLATED: Projects, assessments, and issues created over time',
      line_projects: 'TRANSLATED: Projects',
      line_assessments: 'TRANSLATED: Assessments',
      line_issues: 'TRANSLATED: Issues',
    },
    chart_table_toggle: {
      group_aria_label: 'TRANSLATED: View toggle',
      chart_aria_label: 'TRANSLATED: Chart view',
      table_aria_label: 'TRANSLATED: Table view',
    },
    environment_heatmap: {
      title: 'TRANSLATED: Issues by Environment',
      subtitle: 'TRANSLATED: Device × Assistive Technology',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load data.',
      empty: 'TRANSLATED: No environment data yet.',
      col_device: 'TRANSLATED: Device',
      caption_heatmap:
        'TRANSLATED: Heatmap of open issues by device type and assistive technology. Darker cells indicate more issues.',
      caption_table: 'TRANSLATED: Open issues by device type and assistive technology',
    },
    issue_analysis: {
      heading: 'TRANSLATED: Issue Analysis',
      subtitle: 'TRANSLATED: Issues across all projects',
    },
    issue_statistics: {
      title: 'TRANSLATED: Issue Statistics',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load data.',
      center_label: 'TRANSLATED: Issues',
      col_severity: 'TRANSLATED: Severity',
      col_count: 'TRANSLATED: Count',
      row_total: 'TRANSLATED: Total',
      status_open: 'TRANSLATED: Open',
      status_resolved: 'TRANSLATED: Resolved',
      status_wont_fix: "TRANSLATED: Won't Fix",
      severity_critical: 'TRANSLATED: Critical',
      severity_high: 'TRANSLATED: High',
      severity_medium: 'TRANSLATED: Medium',
      severity_low: 'TRANSLATED: Low',
    },
    pour_radar: {
      title: 'TRANSLATED: Issues by POUR Principle',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load data.',
      empty: 'TRANSLATED: No open issues found.',
      col_principle: 'TRANSLATED: Principle',
      col_issues: 'TRANSLATED: Issues',
      col_percent: 'TRANSLATED: % of Total',
      row_total: 'TRANSLATED: Total',
      caption: 'TRANSLATED: Issues by POUR Principle — open issues only',
      principle_perceivable: 'TRANSLATED: Perceivable',
      principle_operable: 'TRANSLATED: Operable',
      principle_understandable: 'TRANSLATED: Understandable',
      principle_robust: 'TRANSLATED: Robust',
    },
    repeat_offenders: {
      title: 'TRANSLATED: Repeat Offender Criteria',
      subtitle: 'TRANSLATED: Ranked by projects affected',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load data.',
      empty: 'TRANSLATED: No data yet.',
      col_code: 'TRANSLATED: Code',
      col_criterion: 'TRANSLATED: Criterion',
      col_projects: 'TRANSLATED: Projects',
      col_issues: 'TRANSLATED: Issues',
      tooltip_projects: 'TRANSLATED: Projects',
    },
    status_filter: {
      group_aria_label: 'TRANSLATED: Filter by status',
      open: 'TRANSLATED: Open',
      resolved: 'TRANSLATED: Resolved',
      wont_fix: "TRANSLATED: Won't Fix",
    },
    tag_treemap: {
      title: 'TRANSLATED: Issue Tags',
      subtitle: 'TRANSLATED: Open issues by tag frequency',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load data.',
      empty: 'TRANSLATED: No tags found.',
      col_tag: 'TRANSLATED: Tag',
      col_issues: 'TRANSLATED: Issues',
      col_percent: 'TRANSLATED: % of Total',
    },
    wcag_criteria: {
      title: 'TRANSLATED: WCAG Criteria',
      subtitle: 'TRANSLATED: Filtered by principle',
      loading: 'TRANSLATED: Loading…',
      error: 'TRANSLATED: Failed to load WCAG criteria.',
      empty: 'TRANSLATED: No issues logged for {principle} criteria yet.',
      tooltip_issues: 'TRANSLATED: Issues',
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

// ─── ActivityChart ────────────────────────────────────────────────────────────

describe('ActivityChart i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated card title', () => {
    renderWithIntl(<ActivityChart />);
    expect(screen.getByText('TRANSLATED: Projects, Assessments, and Issues')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<ActivityChart />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated error text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false }),
      })
    );
    renderWithIntl(<ActivityChart />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: Failed to load chart data.')).toBeInTheDocument()
    );
  });

  it('shows translated empty text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: [] }),
      })
    );
    renderWithIntl(<ActivityChart />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: No activity in this period.')).toBeInTheDocument()
    );
  });

  it('shows translated range tab labels', () => {
    renderWithIntl(<ActivityChart />);
    expect(screen.getByRole('tab', { name: 'TRANSLATED: 6 months' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: 3 months' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: 1 month' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: 1 week' })).toBeInTheDocument();
  });
});

// ─── ChartTableToggle ─────────────────────────────────────────────────────────

describe('ChartTableToggle i18n', () => {
  it('shows translated aria labels', () => {
    renderWithIntl(<ChartTableToggle view="chart" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'TRANSLATED: View toggle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TRANSLATED: Chart view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TRANSLATED: Table view' })).toBeInTheDocument();
  });
});

// ─── EnvironmentHeatmap ───────────────────────────────────────────────────────

describe('EnvironmentHeatmap i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated heading and subtitle', () => {
    renderWithIntl(<EnvironmentHeatmap />);
    expect(screen.getByText('TRANSLATED: Issues by Environment')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Device × Assistive Technology')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<EnvironmentHeatmap />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated error text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, statusText: 'Error' }));
    renderWithIntl(<EnvironmentHeatmap />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: Failed to load data.')).toBeInTheDocument()
    );
  });

  it('shows translated empty text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      })
    );
    renderWithIntl(<EnvironmentHeatmap />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: No environment data yet.')).toBeInTheDocument()
    );
  });
});

// ─── IssueStatistics ─────────────────────────────────────────────────────────

describe('IssueStatistics i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated card title', () => {
    renderWithIntl(<IssueStatistics statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Issue Statistics')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<IssueStatistics statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated status label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { breakdown: { critical: 1, high: 0, medium: 0, low: 0 }, total: 1 },
        }),
      })
    );
    renderWithIntl(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('TRANSLATED: Loading…')).not.toBeInTheDocument());
    // Status subtitle should use translated label
    expect(screen.getByText('TRANSLATED: Open')).toBeInTheDocument();
  });

  it('shows translated severity labels in chart view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { breakdown: { critical: 2, high: 1, medium: 1, low: 1 }, total: 5 },
        }),
      })
    );
    renderWithIntl(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('TRANSLATED: Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('TRANSLATED: Critical')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: High')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Medium')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Low')).toBeInTheDocument();
  });
});

// ─── PourRadar ────────────────────────────────────────────────────────────────

describe('PourRadar i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated heading', () => {
    renderWithIntl(<PourRadar statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Issues by POUR Principle')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<PourRadar statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated empty text when all totals are zero', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { perceivable: 0, operable: 0, understandable: 0, robust: 0 },
        }),
      })
    );
    renderWithIntl(<PourRadar statuses={['open']} />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: No open issues found.')).toBeInTheDocument()
    );
  });
});

// ─── RepeatOffenders ─────────────────────────────────────────────────────────

describe('RepeatOffenders i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated heading and subtitle', () => {
    renderWithIntl(<RepeatOffenders />);
    expect(screen.getByText('TRANSLATED: Repeat Offender Criteria')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Ranked by projects affected')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<RepeatOffenders />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated error text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, statusText: 'Error' }));
    renderWithIntl(<RepeatOffenders />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: Failed to load data.')).toBeInTheDocument()
    );
  });

  it('shows translated empty text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      })
    );
    renderWithIntl(<RepeatOffenders />);
    await waitFor(() => expect(screen.getByText('TRANSLATED: No data yet.')).toBeInTheDocument());
  });
});

// ─── StatusFilter ─────────────────────────────────────────────────────────────

describe('StatusFilter i18n', () => {
  it('shows translated status option labels', () => {
    renderWithIntl(<StatusFilter statuses={['open']} onChange={() => {}} />);
    expect(screen.getByText('TRANSLATED: Open')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Resolved')).toBeInTheDocument();
    expect(screen.getByText("TRANSLATED: Won't Fix")).toBeInTheDocument();
  });

  it('has translated group aria-label', () => {
    renderWithIntl(<StatusFilter statuses={['open']} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'TRANSLATED: Filter by status' })).toBeInTheDocument();
  });
});

// ─── TagTreemap ───────────────────────────────────────────────────────────────

describe('TagTreemap i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated heading and subtitle', () => {
    renderWithIntl(<TagTreemap />);
    expect(screen.getByText('TRANSLATED: Issue Tags')).toBeInTheDocument();
    expect(screen.getByText('TRANSLATED: Open issues by tag frequency')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<TagTreemap />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated empty text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      })
    );
    renderWithIntl(<TagTreemap />);
    await waitFor(() => expect(screen.getByText('TRANSLATED: No tags found.')).toBeInTheDocument());
  });
});

// ─── WcagCriteria ─────────────────────────────────────────────────────────────

describe('WcagCriteria i18n', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows translated card title', () => {
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: WCAG Criteria')).toBeInTheDocument();
  });

  it('shows translated subtitle', () => {
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Filtered by principle')).toBeInTheDocument();
  });

  it('shows translated loading text', () => {
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    expect(screen.getByText('TRANSLATED: Loading…')).toBeInTheDocument();
  });

  it('shows translated principle tab labels', () => {
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    expect(screen.getByRole('tab', { name: 'TRANSLATED: Perceivable' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: Operable' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: Understandable' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TRANSLATED: Robust' })).toBeInTheDocument();
  });

  it('shows translated error text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false }),
      })
    );
    renderWithIntl(<WcagCriteria statuses={['open']} />);
    await waitFor(() =>
      expect(screen.getByText('TRANSLATED: Failed to load WCAG criteria.')).toBeInTheDocument()
    );
  });
});
