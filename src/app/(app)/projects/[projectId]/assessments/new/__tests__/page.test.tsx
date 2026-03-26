import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
global.fetch = vi.fn().mockResolvedValue({
  json: async () => ({ success: true, data: { name: 'My Project' } }),
});
vi.mock('@/components/assessments/assessment-form', () => ({
  AssessmentForm: ({ externalButtons }: { externalButtons?: string }) => (
    <form id={externalButtons} data-testid="assessment-form" />
  ),
}));

import NewAssessmentPage from '../page';

test('renders Save button outside the card', () => {
  render(<NewAssessmentPage />);
  const btn = screen.getByRole('button', { name: /save assessment/i });
  expect(btn).toHaveAttribute('type', 'submit');
  expect(btn).toHaveAttribute('form', 'new-assessment-form');
});

test('renders Cancel link pointing to project page', () => {
  render(<NewAssessmentPage />);
  expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/projects/p1');
});

test('form has the correct id', () => {
  const { container } = render(<NewAssessmentPage />);
  expect(container.querySelector('form#new-assessment-form')).toBeInTheDocument();
});
