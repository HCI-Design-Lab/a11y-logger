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

  it('ViewToggle is not in the header row with the New Report button', () => {
    render(<ReportsListView reports={[]} />);
    const heading = screen.getByRole('heading', { name: 'Reports' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).not.toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    render(<ReportsListView reports={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });
});
