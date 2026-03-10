import { render, screen } from '@testing-library/react';
import { ReportCard } from '@/components/reports/report-card';
import type { Report } from '@/lib/db/reports';

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
    render(<ReportCard report={mockReport} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/reports/r1');
    expect(screen.getByText('Accessibility Report Q1')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders updated date', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText(/jun/i)).toBeInTheDocument();
  });
});
