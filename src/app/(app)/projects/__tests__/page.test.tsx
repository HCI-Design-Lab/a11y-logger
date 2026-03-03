import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('@/lib/db/projects', () => ({
  getProjects: () => [
    {
      id: '1',
      name: 'Project A',
      description: null,
      status: 'active',
      product_url: null,
      settings: '{}',
      created_by: null,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-01T00:00:00',
      assessment_count: 0,
      issue_count: 0,
    },
  ],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import ProjectsPage from '../page';

test('project grid uses 3-column layout at md breakpoint', async () => {
  const user = userEvent.setup();
  const { container } = render(<ProjectsPage />);

  const gridViewButton = screen.getByRole('button', { name: 'Grid view' });
  await user.click(gridViewButton);

  const grid = container.querySelector('.md\\:grid-cols-3');
  expect(grid).toBeInTheDocument();
});
