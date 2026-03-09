import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportIssuesPanel } from '@/components/reports/report-issues-panel';

const mockIssues = [
  {
    id: 'i1',
    title: 'Button not focusable',
    severity: 'high',
    description: 'The button cannot be reached by keyboard.',
    wcag_codes: ['2.1.1', '4.1.2'],
    assessment_id: 'a1',
    status: 'open',
    url: null,
    device_type: null,
    browser: null,
    operating_system: null,
    assistive_technology: null,
    evidence_media: '[]',
    tags: '[]',
    ai_suggested_codes: '[]',
    ai_confidence_score: null,
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

describe('ReportIssuesPanel', () => {
  it('renders issue titles in list view', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    expect(screen.getByText('Button not focusable')).toBeInTheDocument();
  });

  it('shows severity badge', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('switches to detail view when issue clicked', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    fireEvent.click(screen.getByText('Button not focusable'));
    expect(screen.getByText('The button cannot be reached by keyboard.')).toBeInTheDocument();
    expect(screen.getByText(/back to list/i)).toBeInTheDocument();
  });

  it('returns to list view when Back clicked', () => {
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

  it('shows "Open full issue" link in detail view', () => {
    render(<ReportIssuesPanel issues={mockIssues} />);
    fireEvent.click(screen.getByText('Button not focusable'));
    const link = screen.getByRole('link', { name: /open full issue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
  });
});
