import { render, screen } from '@testing-library/react';
import { VpatCard } from '@/components/vpats/vpat-card';
import type { VpatWithProject } from '@/lib/db/vpats';

const mockVpat: VpatWithProject = {
  id: 'v1',
  project_id: 'p1',
  title: 'Product VPAT',
  status: 'draft',
  version_number: 2,
  wcag_scope: ['1.1.1', '1.4.3'],
  wcag_version: '2.1',
  wcag_level: 'AA',
  criteria_rows: [
    {
      criterion_code: '1.1.1',
      conformance: 'supports',
      remarks: null,
      related_issue_ids: ['issue-a', 'issue-b'],
    },
  ],
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  project_name: 'Project Alpha',
};

describe('VpatCard', () => {
  it('renders title as a link', () => {
    render(<VpatCard vpat={mockVpat} />);
    const titleLink = screen.getByRole('link', { name: 'Product VPAT' });
    expect(titleLink).toHaveAttribute('href', '/vpats/v1');
    expect(screen.getByText('Product VPAT')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders version number', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('does not render a scope criteria count label', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.queryByText('2 criteria')).not.toBeInTheDocument();
    expect(screen.queryByText(/all criteria/i)).not.toBeInTheDocument();
  });

  it('shows WCAG scope badge', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText(/wcag 2\.1/i)).toBeInTheDocument();
  });

  it('does not show inline Edit or Delete action buttons', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('renders project name linked to the project', () => {
    render(<VpatCard vpat={mockVpat} />);
    const projectLink = screen.getByRole('link', { name: 'Project Alpha' });
    expect(projectLink).toBeInTheDocument();
    expect(projectLink).toHaveAttribute('href', '/projects/p1');
  });

  it('renders issue count', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('2 issues')).toBeInTheDocument();
  });

  it('renders singular "issue" when count is 1', () => {
    const singleIssueMock: VpatWithProject = {
      ...mockVpat,
      criteria_rows: [
        {
          criterion_code: '1.1.1',
          conformance: 'supports',
          remarks: null,
          related_issue_ids: ['issue-a'],
        },
      ],
    };
    render(<VpatCard vpat={singleIssueMock} />);
    expect(screen.getByText('1 issue')).toBeInTheDocument();
  });

  it('renders 0 issues when criteria_rows is empty', () => {
    const emptyMock: VpatWithProject = {
      ...mockVpat,
      criteria_rows: [],
      project_name: 'Project Alpha',
    };
    render(<VpatCard vpat={emptyMock} />);
    expect(screen.getByText('0 issues')).toBeInTheDocument();
  });
});
