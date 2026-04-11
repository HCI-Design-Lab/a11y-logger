/**
 * i18n integration tests for IssueAnalysisSection.
 * Kept in a separate file because it requires mocking child dashboard
 * components, which would interfere with tests that render those components
 * directly.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { IssueAnalysisSection } from '@/components/dashboard/issue-analysis-section';

// Mock all child components so only IssueAnalysisSection's own strings are tested
vi.mock('../issue-statistics', () => ({
  IssueStatistics: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="issue-statistics" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../pour-radar', () => ({
  PourRadar: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="pour-radar" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../wcag-criteria', () => ({
  WcagCriteria: ({ statuses }: { statuses: string[] }) => (
    <div data-testid="wcag-criteria" data-statuses={statuses.join(',')} />
  ),
}));
vi.mock('../status-filter', () => ({
  StatusFilter: ({
    statuses,
    onChange,
  }: {
    statuses: string[];
    onChange: (s: string[]) => void;
  }) => (
    <div data-testid="status-filter" data-statuses={statuses.join(',')}>
      <button onClick={() => onChange(['open', 'resolved'])}>Change</button>
    </div>
  ),
}));

const messages = {
  dashboard: {
    issue_analysis: {
      heading: 'TRANSLATED: Issue Analysis',
      subtitle: 'TRANSLATED: Issues across all projects',
    },
    // status_filter needed because StatusFilter is mocked but IssueAnalysisSection
    // renders it and passes statuses — the mock doesn't call t() so no keys needed here
    status_filter: {
      group_aria_label: 'Filter by status',
      open: 'Open',
      resolved: 'Resolved',
      wont_fix: "Won't Fix",
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

describe('IssueAnalysisSection i18n', () => {
  it('shows translated heading', () => {
    renderWithIntl(<IssueAnalysisSection />);
    expect(screen.getByRole('heading', { name: 'TRANSLATED: Issue Analysis' })).toBeInTheDocument();
  });

  it('shows translated subtitle', () => {
    renderWithIntl(<IssueAnalysisSection />);
    expect(screen.getByText('TRANSLATED: Issues across all projects')).toBeInTheDocument();
  });
});
