import { render, screen } from '@testing-library/react';
import { ReportCard } from '@/components/reports/report-card';

const mockReport = {
  id: '1',
  project_id: 'proj-1',
  title: 'Q1 Accessibility Report',
  type: 'executive' as const,
  content: '[]',
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: null,
  status: 'draft' as const,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-15T00:00:00',
};

test('renders report title', () => {
  render(<ReportCard report={mockReport} />);
  expect(screen.getByText('Q1 Accessibility Report')).toBeInTheDocument();
});

test('renders type badge', () => {
  render(<ReportCard report={mockReport} />);
  expect(screen.getByText(/executive/i)).toBeInTheDocument();
});

test('renders status badge', () => {
  render(<ReportCard report={mockReport} />);
  expect(screen.getByText(/draft/i)).toBeInTheDocument();
});

test('links to report detail page', () => {
  render(<ReportCard report={mockReport} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/reports/1');
});
