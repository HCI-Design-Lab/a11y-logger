import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { vi } from 'vitest';
import type { IssueWithContext } from '@/lib/db/issues';

let mockSeverity: string | null = null;
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'severity' ? mockSeverity : null) }),
  useRouter: () => ({ push: vi.fn() }),
}));

import { IssuesListView } from '../issues-list-view';

const messages = {
  issues: {
    badge: {
      severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
      status: { open: 'Open', resolved: 'Resolved', wont_fix: "Won't Fix" },
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

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
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('filters issues by title', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'alt text' } });
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
    expect(screen.queryByText('Keyboard trap in modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Low contrast ratio')).not.toBeInTheDocument();
  });

  it('filters issues by tag', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'keyboard' } });
    expect(screen.getByText('Keyboard trap in modal')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('filters issues by assessment name', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Q2 Audit' } });
    expect(screen.getByText('Keyboard trap in modal')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('filters issues by project name', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Beta App' } });
    expect(screen.getByText('Low contrast ratio')).toBeInTheDocument();
    expect(screen.queryByText('Missing alt text')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ALT TEXT' } });
    expect(screen.getByText('Missing alt text')).toBeInTheDocument();
  });

  it('shows all issues when search is cleared', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
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
    renderWithIntl(<IssuesListView issues={[]} />);
    const link = screen.getByRole('link', { name: /new issue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/issues/new');
  });

  it('ViewToggle is in the header row with the New Issue button', () => {
    renderWithIntl(<IssuesListView issues={[]} />);
    const heading = screen.getByRole('heading', { name: 'Issues' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).toContainElement(viewGroup);
  });

  it('ViewToggle is not in the filter/search row', () => {
    renderWithIntl(<IssuesListView issues={[]} />);
    const search = document.getElementById('issues-search')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(search.parentElement).not.toContainElement(viewGroup);
  });
});

describe('IssuesListView search input component', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('search input uses the Input component (has data-slot="input")', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    const searchbox = screen.getByRole('searchbox');
    expect(searchbox).toHaveAttribute('data-slot', 'input');
  });

  it('search input uses the Input component in grid view', () => {
    renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    const searchbox = screen.getByRole('searchbox');
    expect(searchbox).toHaveAttribute('data-slot', 'input');
  });
});

describe('IssuesListView layout and style', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('renders a section with aria-labelledby pointing to the Issues heading', () => {
    const { container } = renderWithIntl(<IssuesListView issues={[]} />);
    const section = container.querySelector('section[aria-labelledby]');
    expect(section).toBeInTheDocument();
    const headingId = section!.getAttribute('aria-labelledby');
    expect(document.getElementById(headingId!)).toHaveTextContent('Issues');
  });

  it('New Issue button does not have the outline variant class', () => {
    renderWithIntl(<IssuesListView issues={[]} />);
    const link = screen.getByRole('link', { name: /new issue/i });
    expect(link.className).not.toContain('border-input');
  });

  it('shows an empty state message when no issues match the filter', () => {
    renderWithIntl(<IssuesListView issues={[]} />);
    expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
  });

  it('does not show empty state when issues are present', () => {
    renderWithIntl(<IssuesListView issues={[makeIssue('i1', 'high')]} />);
    expect(screen.queryByText(/no issues found/i)).not.toBeInTheDocument();
  });
});

describe('IssuesListView filter/search placement by view', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('in table view (default), filter and search are inside the table card, not sibling to it', () => {
    const { container } = renderWithIntl(<IssuesListView issues={searchIssues} />);
    const section = container.querySelector('section')!;
    const searchbox = screen.getByRole('searchbox');

    // header + card = 2 direct children (filter is inside the card)
    expect(Array.from(section.children)).toHaveLength(2);
    // The card (second child) contains the searchbox
    expect(section.children[1]).toContainElement(searchbox as HTMLElement);
  });

  it('in grid view, filter and search are outside the grid', () => {
    const { container } = renderWithIntl(<IssuesListView issues={searchIssues} />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));

    const section = container.querySelector('section')!;
    const searchbox = screen.getByRole('searchbox');

    // header + filter bar + grid = 3 direct children
    expect(Array.from(section.children)).toHaveLength(3);
    // Filter bar (second child) contains the searchbox
    expect(section.children[1]).toContainElement(searchbox as HTMLElement);
    // Grid (third child) does NOT contain the searchbox
    expect(section.children[2]).not.toContainElement(searchbox as HTMLElement);
  });
});

describe('IssuesListView severity filter', () => {
  beforeEach(() => {
    mockSeverity = null;
  });

  it('renders All, Critical, High, Medium, Low filter links', () => {
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Critical' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'High' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Low' })).toBeInTheDocument();
  });

  it('All link points to /issues', () => {
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/issues');
  });

  it('severity links point to /issues?severity=X', () => {
    renderWithIntl(<IssuesListView issues={issues} />);
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
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'All' })).toHaveClass('bg-primary');
  });

  it('active severity tab is selected', () => {
    mockSeverity = 'high';
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByRole('link', { name: 'High' })).toHaveClass('bg-primary');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveClass('bg-primary');
  });

  it('shows only issues matching active severity filter', () => {
    mockSeverity = 'critical';
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByText('Issue i1')).toBeInTheDocument();
    expect(screen.queryByText('Issue i2')).not.toBeInTheDocument();
    expect(screen.queryByText('Issue i3')).not.toBeInTheDocument();
  });

  it('shows all issues when no severity filter is active', () => {
    mockSeverity = null;
    renderWithIntl(<IssuesListView issues={issues} />);
    expect(screen.getByText('Issue i1')).toBeInTheDocument();
    expect(screen.getByText('Issue i2')).toBeInTheDocument();
    expect(screen.getByText('Issue i3')).toBeInTheDocument();
  });
});
