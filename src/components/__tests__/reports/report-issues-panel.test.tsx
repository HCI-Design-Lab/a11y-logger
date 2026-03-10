import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportIssuesPanel } from '@/components/reports/report-issues-panel';

const mockIssues = [
  {
    id: 'i1',
    title: 'Button not focusable',
    severity: 'high' as const,
    description: 'The button cannot be reached by keyboard.',
    wcag_codes: ['2.1.1', '4.1.2'],
    assessment_id: 'a1',
    project_id: 'p1',
    project_name: 'Test Project',
    assessment_name: 'Test Assessment',
    status: 'open' as const,
    url: null,
    device_type: null,
    browser: null,
    operating_system: null,
    assistive_technology: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
    evidence_media: [],
    tags: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'i2',
    title: 'Missing alt text',
    severity: 'critical' as const,
    description: null,
    wcag_codes: ['1.1.1'],
    assessment_id: 'a1',
    project_id: 'p1',
    project_name: 'Test Project',
    assessment_name: 'Test Assessment',
    status: 'open' as const,
    url: null,
    device_type: null,
    browser: null,
    operating_system: null,
    assistive_technology: null,
    user_impact: null,
    selector: null,
    code_snippet: null,
    suggested_fix: null,
    evidence_media: [],
    tags: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

describe('ReportIssuesPanel', () => {
  it('renders issue titles in table', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    expect(screen.getByText('Button not focusable')).toBeInTheDocument();
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('renders severity badges', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('opens detail view when row clicked', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    fireEvent.click(screen.getByText('Button not focusable'));
    expect(screen.getByText('The button cannot be reached by keyboard.')).toBeInTheDocument();
    expect(screen.getByText(/back to list/i)).toBeInTheDocument();
  });

  it('shows "Open full issue" link with correct href in detail view', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    fireEvent.click(screen.getByText('Button not focusable'));
    const link = screen.getByRole('link', { name: /open full issue/i });
    expect(link).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/i1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('returns to table when Back clicked', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    fireEvent.click(screen.getByText('Button not focusable'));
    fireEvent.click(screen.getByText(/back to list/i));
    expect(screen.getByText('Button not focusable')).toBeInTheDocument();
    expect(screen.queryByText(/back to list/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no issues', () => {
    render(<ReportIssuesPanel issues={[]} />);
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it('filters issues by search query', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'alt' } });
    expect(screen.queryByText('Button not focusable')).not.toBeInTheDocument();
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('shows no-results message when search has no matches', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/no issues match/i)).toBeInTheDocument();
  });

  it('sorts by severity when severity column header clicked', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    // Default sort is severity asc (critical first)
    const rows = screen.getAllByRole('row').slice(1); // skip header
    expect(rows[0]).toHaveTextContent('Missing alt text'); // critical
    expect(rows[1]).toHaveTextContent('Button not focusable'); // high
  });

  it('reverses sort when same column clicked again', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    const severityBtn = screen.getByRole('button', { name: /severity/i });
    fireEvent.click(severityBtn); // toggle to desc
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Button not focusable'); // high first in desc
  });

  it('shows Title and Severity column headers', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    expect(screen.getByRole('button', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /severity/i })).toBeInTheDocument();
  });
});
