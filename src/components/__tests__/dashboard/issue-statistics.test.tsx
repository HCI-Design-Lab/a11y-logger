import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

// Mock Recharts — it uses browser APIs not available in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}));

const severityBreakdown = { critical: 4, high: 18, medium: 10, low: 3 };

describe('IssueStatistics', () => {
  it('renders the open issue count', () => {
    render(<IssueStatistics openTotal={35} severityBreakdown={severityBreakdown} />);
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders all four severity labels in chart view', () => {
    render(<IssueStatistics openTotal={35} severityBreakdown={severityBreakdown} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders chart view by default (chart toggle button is pressed)', () => {
    render(<IssueStatistics openTotal={35} severityBreakdown={severityBreakdown} />);
    const chartButton = screen.getByRole('button', { name: 'Chart view' });
    expect(chartButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to table view when table toggle is clicked', () => {
    render(<IssueStatistics openTotal={35} severityBreakdown={severityBreakdown} />);
    const tableButton = screen.getByRole('button', { name: 'Table view' });
    fireEvent.click(tableButton);
    expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    // Table should now show the Severity | Count header
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('table view shows correct severity counts', () => {
    render(<IssueStatistics openTotal={35} severityBreakdown={severityBreakdown} />);
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(screen.getByText('4')).toBeInTheDocument(); // critical
    expect(screen.getByText('18')).toBeInTheDocument(); // high
    expect(screen.getByText('10')).toBeInTheDocument(); // medium
    expect(screen.getByText('3')).toBeInTheDocument(); // low
  });
});
