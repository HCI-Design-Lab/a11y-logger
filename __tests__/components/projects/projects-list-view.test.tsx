import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProjectsListView } from '@/components/projects/projects-list-view';
import type { ProjectWithCounts } from '@/lib/db/projects';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockProjects: ProjectWithCounts[] = [
  {
    id: 'p1',
    name: 'Alpha',
    description: null,
    product_url: null,
    status: 'active',
    settings: '{}',
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    assessment_count: 2,
    issue_count: 4,
  },
];

describe('ProjectsListView', () => {
  it('defaults to table view', () => {
    render(<ProjectsListView projects={mockProjects} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view when grid toggle clicked', async () => {
    render(<ProjectsListView projects={mockProjects} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('switches back to table view', async () => {
    render(<ProjectsListView projects={mockProjects} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    await userEvent.click(screen.getByRole('button', { name: /table view/i }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
