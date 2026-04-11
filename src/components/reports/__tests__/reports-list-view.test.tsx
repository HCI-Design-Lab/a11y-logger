import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/reports/report-card', () => ({
  ReportCard: () => <div data-testid="report-card" />,
}));
vi.mock('@/components/reports/report-badge-utils', () => ({
  getStatusBadgeClass: () => '',
}));

import { ReportsListView } from '../reports-list-view';

describe('ReportsListView layout', () => {
  it('renders the New Report link', () => {
    render(<ReportsListView reports={[]} />);
    expect(screen.getByRole('link', { name: /new report/i })).toBeInTheDocument();
  });

  it('ViewToggle is in the header row with the New Report button', () => {
    render(<ReportsListView reports={[]} />);
    const heading = screen.getByRole('heading', { name: 'Reports' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    render(<ReportsListView reports={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });

  it('header section has aria-labelledby pointing to the Reports heading', () => {
    render(<ReportsListView reports={[]} />);
    const heading = screen.getByRole('heading', { name: 'Reports' });
    expect(heading).toHaveAttribute('id', 'reports-heading');
    const section = heading.closest('section')!;
    expect(section).toHaveAttribute('aria-labelledby', 'reports-heading');
  });

  it('shows empty state without a double-bordered Card wrapper', () => {
    render(<ReportsListView reports={[]} />);
    const dashed = document.querySelector('.border-dashed')!;
    // should not be inside a Card (which uses rounded-lg border)
    expect(dashed.closest('[data-slot="card"]')).toBeNull();
  });

  it('renders "Published" badge in table view for a published report', () => {
    const report = {
      id: 'r1',
      assessment_ids: [],
      title: 'Q1 Report',
      type: 'executive' as const,
      content: '{}',
      template_id: null,
      ai_generated: 0,
      created_by: null,
      published_at: null,
      status: 'published' as const,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-15T00:00:00',
    };
    render(<ReportsListView reports={[report]} />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });
});
