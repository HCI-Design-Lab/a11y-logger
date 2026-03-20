import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { IssueWithContext } from '@/lib/db/issues';

let mockSeverity: string | null = null;
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'severity' ? mockSeverity : null) }),
}));

import { IssuesListView } from '../issues-list-view';

const makeIssue = (id: string, severity: IssueWithContext['severity']): IssueWithContext => ({
  id,
  assessment_id: 'a1',
  project_id: 'p1',
  project_name: 'My Project',
  assessment_name: 'Q1 Audit',
  title: `Issue ${id}`,
  severity,
  status: 'open',
  description: null,
  url: null,
  wcag_codes: [],
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
  section_508_codes: [],
  eu_codes: [],
  evidence_media: [],
  tags: [],
  created_by: null,
  resolved_by: null,
  resolved_at: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
});

const issues: IssueWithContext[] = [
  makeIssue('i1', 'critical'),
  makeIssue('i2', 'high'),
  makeIssue('i3', 'medium'),
];

const searchIssues: IssueWithContext[] = [
  { ...makeIssue('s1', 'critical'), title: 'Missing alt text', tags: ['images', 'wcag'] },
  {
    ...makeIssue('s2', 'high'),
    title: 'Keyboard trap in modal',
    tags: ['keyboard'],
    assessment_name: 'Q2 Audit',
  },
  {
    ...makeIssue('s3', 'medium'),
    title: 'Low contrast ratio',
    tags: [],
    project_name: 'Beta App',
  },
];

describe('IssuesListView search', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('renders a search input', () => {
    render(<IssuesListView issues={searchIssues} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('filters issues by title', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'alt text' } });
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
    expect(screen.queryByText('Keyboard trap in modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Low contrast ratio')).not.toBeInTheDocument();
  });

  it('filters issues by tag', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'keyboard' } });
    expect(screen.getByText('Keyboard trap in modal')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('filters issues by assessment name', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Q2 Audit' } });
    expect(screen.getByText('Keyboard trap in modal')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('filters issues by project name', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Beta App' } });
    expect(screen.getByText('Low contrast ratio')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ALT TEXT' } });
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('shows all issues when search is cleared', () => {
    render(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'alt text' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
    expect(screen.getByText('Keyboard trap in modal')).toBeInTheDocument();
    expect(screen.getByText('Low contrast ratio')).toBeInTheDocument();
  });
});

describe('IssuesListView New Issue button', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('renders a New Issue link pointing to /issues/new', () => {
    render(<IssuesListView issues={[]} />);
    const link = screen.getByRole('link', { name: /new issue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/issues/new');
  });

  it('ViewToggle is not in the header row with the New Issue button', () => {
    render(<IssuesListView issues={[]} />);
    const heading = screen.getByRole('heading', { name: 'Issues' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).not.toContainElement(viewGroup);
  });

  it('ViewToggle is in the filter/search row alongside the search input', () => {
    render(<IssuesListView issues={[]} />);
    const search = document.getElementById('issues-search')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    // Both the search input and ViewToggle should share the same parent row
    expect(search.parentElement).toContainElement(viewGroup);
  });
});

describe('IssuesListView severity filter', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('renders All, Critical, High, Medium, Low filter links', () => {
    render(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Critical' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'High' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Low' })).toBeInTheDocument();
  });

  it('All link points to /issues', () => {
    render(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/issues');
  });

  it('severity links point to /issues?severity=X', () => {
    render(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'Critical' })).toHaveAttribute(
      'href',
      '/issues?severity=critical'
    );
    expect(screen.getByRole('link', { name: 'High' })).toHaveAttribute(
      'href',
      '/issues?severity=high'
    );
  });

  it('All link has active style when no severity filter is active', () => {
    mockSeverity = null;
    render(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toHaveClass('bg-primary');
  });

  it('active severity link has active style', () => {
    mockSeverity = 'high';
    render(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'High' })).toHaveClass('bg-primary');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveClass('bg-primary');
  });

  it('shows only issues matching active severity filter', () => {
    mockSeverity = 'critical';
    render(<IssuesListView issues={issues} />);
    expect(screen.getByText('Issue i1')).toBeInTheDocument();
    expect(screen.queryByText('Issue i2')).not.toBeInTheDocument();
    expect(screen.queryByText('Issue i3')).not.toBeInTheDocument();
  });

  it('shows all issues when no severity filter is active', () => {
    mockSeverity = null;
    render(<IssuesListView issues={issues} />);
    expect(screen.getByText('Issue i1')).toBeInTheDocument();
    expect(screen.getByText('Issue i2')).toBeInTheDocument();
    expect(screen.getByText('Issue i3')).toBeInTheDocument();
  });
});
