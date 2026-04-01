import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportWcagCriteriaList } from '@/components/reports/report-wcag-criteria-list';

const criteria = [
  { code: '1.3.1', name: 'Info and Relationships', count: 4 },
  { code: '2.4.3', name: 'Focus Order', count: 3 },
  { code: '4.1.2', name: 'Name, Role, Value', count: 1 },
];

describe('ReportWcagCriteriaList', () => {
  it('renders the section heading', () => {
    render(<ReportWcagCriteriaList criteria={criteria} />);
    expect(screen.getByText('WCAG by Criterion')).toBeInTheDocument();
  });

  it('renders each criterion code and name', () => {
    render(<ReportWcagCriteriaList criteria={criteria} />);
    expect(screen.getByText('1.3.1 - Info and Relationships')).toBeInTheDocument();
    expect(screen.getByText('2.4.3 - Focus Order')).toBeInTheDocument();
    expect(screen.getByText('4.1.2 - Name, Role, Value')).toBeInTheDocument();
  });

  it('renders each count badge', () => {
    render(<ReportWcagCriteriaList criteria={criteria} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders the code alone when name is null', () => {
    render(<ReportWcagCriteriaList criteria={[{ code: '9.9.9', name: null, count: 2 }]} />);
    expect(screen.getByText('9.9.9')).toBeInTheDocument();
  });

  it('renders empty state when no criteria', () => {
    render(<ReportWcagCriteriaList criteria={[]} />);
    expect(screen.getByText(/no wcag/i)).toBeInTheDocument();
  });
});
