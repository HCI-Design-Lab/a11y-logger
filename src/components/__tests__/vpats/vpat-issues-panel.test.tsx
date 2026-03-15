import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VpatIssuesPanel } from '@/components/vpats/vpat-issues-panel';

const mockIssues = [
  {
    id: 'issue-1',
    title: 'Missing alt text',
    severity: 'critical' as const,
    description: 'Images lack alt text on the homepage',
    project_id: 'p1',
    assessment_id: 'a1',
  },
];

describe('VpatIssuesPanel', () => {
  it('renders issue title', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('renders Open Issue link that opens in new tab', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    const link = screen.getByRole('link', { name: /open issue/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to correct issue URL', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    const link = screen.getByRole('link', { name: /open issue/i });
    expect(link).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/issue-1');
  });

  it('renders empty state when no issues', () => {
    render(<VpatIssuesPanel issues={[]} criterionCode="1.1.1" />);
    expect(screen.getByText(/no issues linked/i)).toBeInTheDocument();
  });

  it('shows criterion code in panel header', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    expect(screen.getByText(/1\.1\.1/)).toBeInTheDocument();
  });

  it('renders issue description when present', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    expect(screen.getByText(/Images lack alt text/i)).toBeInTheDocument();
  });

  it('renders severity badge for each issue', () => {
    render(<VpatIssuesPanel issues={mockIssues} criterionCode="1.1.1" />);
    // SeverityBadge renders the severity value as text
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });
});
