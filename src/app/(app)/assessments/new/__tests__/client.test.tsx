import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/assessments/assessment-form', () => ({
  AssessmentForm: ({ externalButtons }: { externalButtons?: string }) => (
    <form id={externalButtons} data-testid="assessment-form" />
  ),
}));

import NewAssessmentClient from '../client';

test('renders Save button outside the card', () => {
  render(<NewAssessmentClient projects={[]} />);
  const btn = screen.getByRole('button', { name: /save assessment/i });
  expect(btn).toHaveAttribute('type', 'submit');
  expect(btn).toHaveAttribute('form', 'new-assessment-form');
});

test('renders Cancel link outside the card', () => {
  render(<NewAssessmentClient projects={[]} />);
  expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/assessments');
});

test('form has the correct id', () => {
  const { container } = render(<NewAssessmentClient projects={[]} />);
  expect(container.querySelector('form#new-assessment-form')).toBeInTheDocument();
});
