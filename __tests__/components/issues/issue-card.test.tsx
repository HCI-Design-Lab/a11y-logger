import { render, screen } from '@testing-library/react';
import { IssueCard } from '@/components/issues/issue-card';
import type { IssueWithContext } from '@/lib/db/issues';

const mockIssue: IssueWithContext = {
  id: 'i1',
  assessment_id: 'a1',
  project_id: 'p1',
  project_name: 'My Project',
  assessment_name: 'Q1 Audit',
  title: 'Missing alt text',
  description: 'Images lack alternative text',
  severity: 'high',
  status: 'open',
  url: null,
  wcag_codes: [],
  section_508_codes: [],
  eu_codes: [],
  ai_suggested_codes: [],
  ai_confidence_score: null,
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
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('IssueCard', () => {
  it('renders title as a link to the issue', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/projects/p1/assessments/a1/issues/i1'
    );
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('renders severity and status badges', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders project and assessment context', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('Q1 Audit')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('Images lack alternative text')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<IssueCard issue={{ ...mockIssue, description: null }} />);
    expect(screen.queryByText('Images lack alternative text')).not.toBeInTheDocument();
  });
});
