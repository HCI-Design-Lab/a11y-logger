import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VpatsListView } from '@/components/vpats/vpats-list-view';
import type { VpatWithProject } from '@/lib/db/vpats';

const mockVpats: VpatWithProject[] = [
  {
    id: 'v1',
    project_id: 'p1',
    title: 'Product VPAT',
    status: 'draft',
    version_number: 1,
    wcag_scope: [],
    wcag_version: '2.1',
    wcag_level: 'AA',
    criteria_rows: [
      {
        criterion_code: '1.1.1',
        conformance: 'supports',
        remarks: null,
        related_issue_ids: ['issue-1', 'issue-2'],
      },
      {
        criterion_code: '1.3.1',
        conformance: 'does_not_support',
        remarks: null,
        related_issue_ids: ['issue-2', 'issue-3'],
      },
    ],
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    project_name: 'Project Alpha',
  },
];

describe('VpatsListView', () => {
  it('defaults to table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    render(<VpatsListView vpats={mockVpats} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Product VPAT')).toBeInTheDocument();
  });

  it('shows WCAG scope badge in table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    expect(screen.getByText(/wcag 2\.1/i)).toBeInTheDocument();
  });

  it('does not show inline Edit or Delete actions in table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows project name linked to the project in table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    const projectLink = screen.getByRole('link', { name: 'Project Alpha' });
    expect(projectLink).toBeInTheDocument();
    expect(projectLink).toHaveAttribute('href', '/projects/p1');
  });

  it('shows deduplicated issue count in table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    // issue-1, issue-2, issue-3 across two criteria rows — 3 unique issues
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
