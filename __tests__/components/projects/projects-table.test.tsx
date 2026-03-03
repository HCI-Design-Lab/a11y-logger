import { render, screen } from '@testing-library/react';
import { ProjectsTable } from '@/components/projects/projects-table';
import type { ProjectWithCounts } from '@/lib/db/projects';

const mockProjects: ProjectWithCounts[] = [
  {
    id: 'p1',
    name: 'Alpha',
    description: 'A description',
    product_url: null,
    status: 'active',
    settings: '{}',
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    assessment_count: 3,
    issue_count: 7,
  },
];

describe('ProjectsTable', () => {
  it('renders project name as a link', () => {
    render(<ProjectsTable projects={mockProjects} />);
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/projects/p1');
  });

  it('renders assessment and issue counts', () => {
    render(<ProjectsTable projects={mockProjects} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders empty message when no projects', () => {
    render(<ProjectsTable projects={[]} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });
});
