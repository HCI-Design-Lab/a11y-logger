import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ReportsListView } from '@/components/reports/reports-list-view';
import type { Report } from '@/lib/db/reports';

const messages = {
  reports: {
    status: {
      draft: 'Draft',
      published: 'Published',
    },
    list: {
      empty_heading: 'No reports yet',
      empty_description: 'Create your first report to get started.',
      new_button: 'New Report',
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

const mockReports: Report[] = [
  {
    id: 'r1',
    assessment_ids: [],
    title: 'Q1 Report',
    type: 'detailed',
    status: 'draft',
    content: '{}',
    template_id: null,
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('ReportsListView', () => {
  it('defaults to table view', () => {
    renderWithIntl(<ReportsListView reports={mockReports} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    renderWithIntl(<ReportsListView reports={mockReports} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Q1 Report')).toBeInTheDocument();
  });
});
