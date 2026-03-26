import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/project-card';
import type { ProjectWithCounts } from '@/lib/db/projects';

const mockProject: ProjectWithCounts = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  product_url: null,
  settings: '{}',
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  assessment_count: 3,
  issue_count: 12,
};

test('renders project name', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByText('Test Project')).toBeInTheDocument();
});

test('renders project description', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByText('A test project')).toBeInTheDocument();
});

test('shows assessment and issue counts', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByText(/3/)).toBeInTheDocument();
  expect(screen.getByText(/12/)).toBeInTheDocument();
});

test('card links to project detail', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/1');
});

test('uses singular labels when counts are 1', () => {
  render(<ProjectCard project={{ ...mockProject, assessment_count: 1, issue_count: 1 }} />);
  expect(screen.getByText('1 assessment')).toBeInTheDocument();
  expect(screen.getByText('1 issue')).toBeInTheDocument();
});
