import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ReportCard } from '@/components/reports/report-card';
import type { Report } from '@/lib/db/reports';

const messages = {
  reports: {
    status: {
      draft: 'Draft',
      published: 'Published',
      updated_at: 'Updated {date}',
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

const mockReport: Report = {
  id: 'r1',
  assessment_ids: [],
  title: 'Accessibility Report Q1',
  type: 'detailed',
  status: 'draft',
  content: '{}',
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-15T12:00:00Z',
};

describe('ReportCard', () => {
  it('renders title as a link', () => {
    renderWithIntl(<ReportCard report={mockReport} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/reports/r1');
    expect(screen.getByText('Accessibility Report Q1')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderWithIntl(<ReportCard report={mockReport} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders updated date', () => {
    renderWithIntl(<ReportCard report={mockReport} />);
    expect(screen.getByText(/jun/i)).toBeInTheDocument();
  });
});
