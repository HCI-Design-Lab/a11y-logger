import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/projects/project-form', () => ({
  ProjectForm: ({ externalButtons }: { externalButtons?: string }) => (
    <form id={externalButtons} data-testid="project-form" />
  ),
}));

import NewProjectPage from '../page';

test('renders Save button outside the card', () => {
  render(<NewProjectPage />);
  const btn = screen.getByRole('button', { name: /save project/i });
  expect(btn).toHaveAttribute('type', 'submit');
  expect(btn).toHaveAttribute('form', 'new-project-form');
});

test('renders Cancel link outside the card', () => {
  render(<NewProjectPage />);
  expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/projects');
});

test('form has the correct id', () => {
  const { container } = render(<NewProjectPage />);
  expect(container.querySelector('form#new-project-form')).toBeInTheDocument();
});
