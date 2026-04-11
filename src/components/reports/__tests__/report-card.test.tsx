import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ReportCard } from '@/components/reports/report-card';

const messages = {
  reports: {
    status: {
      draft: 'Draft',
      published: 'Published',
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

const mockReport = {
  id: '1',
  assessment_ids: [],
  title: 'Q1 Accessibility Report',
  type: 'executive' as const,
  content: '{}',
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: null,
  status: 'draft' as const,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-15T00:00:00',
};

test('renders report title', () => {
  renderWithIntl(<ReportCard report={mockReport} />);
  expect(screen.getByText('Q1 Accessibility Report')).toBeInTheDocument();
});

test('renders status badge', () => {
  renderWithIntl(<ReportCard report={mockReport} />);
  expect(screen.getByText(/draft/i)).toBeInTheDocument();
});

test('links to report detail page', () => {
  renderWithIntl(<ReportCard report={mockReport} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/reports/1');
});

test('renders updated_at date formatted as locale string', () => {
  renderWithIntl(<ReportCard report={mockReport} />);
  const expectedDate = new Date('2026-01-15T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  expect(screen.getByText(`Updated ${expectedDate}`)).toBeInTheDocument();
});

test('renders "Unknown" for invalid updated_at date', () => {
  renderWithIntl(<ReportCard report={{ ...mockReport, updated_at: 'not-a-date' }} />);
  expect(screen.getByText('Updated Unknown')).toBeInTheDocument();
});
