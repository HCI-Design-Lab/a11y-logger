/**
 * i18n integration tests for the 4 report section components.
 * Each component must render its section title and (for empty-state sections)
 * add-placeholder text from the `reports.sections` translation namespace.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({ value }: { value: string }) => (
    <div data-testid="rich-text-editor">{value}</div>
  ),
}));

import { ExecutiveSummarySection } from '@/components/reports/report-section-executive-summary';
import { TopRisksSection } from '@/components/reports/report-section-top-risks';
import { QuickWinsSection } from '@/components/reports/report-section-quick-wins';
import { UserImpactSection } from '@/components/reports/report-section-user-impact';

const messages = {
  reports: {
    sections: {
      executive_summary_title: 'Executive Summary',
      executive_summary_add: 'Add Executive Summary',
      top_risks_title: 'Top Risks',
      top_risks_add: 'Add Top Risks',
      quick_wins_title: 'Quick Wins',
      quick_wins_add: 'Add Quick Wins',
      user_impact_title: 'User Impact',
      user_impact_add: 'Add User Impact',
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

const EMPTY_USER_IMPACT = {
  screen_reader: '',
  low_vision: '',
  color_vision: '',
  keyboard_only: '',
  cognitive: '',
  deaf_hard_of_hearing: '',
};

describe('ExecutiveSummarySection i18n', () => {
  it('renders section title from translations', () => {
    renderWithIntl(
      <ExecutiveSummarySection
        body=""
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
  });
});

describe('TopRisksSection i18n', () => {
  it('renders section title from translations', () => {
    renderWithIntl(
      <TopRisksSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByText('Top Risks')).toBeInTheDocument();
  });
});

describe('QuickWinsSection i18n', () => {
  it('renders section title from translations', () => {
    renderWithIntl(
      <QuickWinsSection
        items={[]}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
  });
});

describe('UserImpactSection i18n', () => {
  it('renders section title from translations', () => {
    renderWithIntl(
      <UserImpactSection
        data={EMPTY_USER_IMPACT}
        onChange={vi.fn()}
        onDelete={vi.fn()}
        onGenerate={vi.fn()}
        isGenerating={false}
      />
    );
    expect(screen.getByText('User Impact')).toBeInTheDocument();
  });
});
