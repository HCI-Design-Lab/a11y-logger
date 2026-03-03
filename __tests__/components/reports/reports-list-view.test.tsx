import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsListView } from '@/components/reports/reports-list-view';
import type { Report } from '@/lib/db/reports';

const mockReports: Report[] = [
  {
    id: 'r1',
    project_id: 'p1',
    title: 'Q1 Report',
    type: 'detailed',
    status: 'draft',
    content: '[]',
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
    render(<ReportsListView reports={mockReports} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    render(<ReportsListView reports={mockReports} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Q1 Report')).toBeInTheDocument();
  });
});
