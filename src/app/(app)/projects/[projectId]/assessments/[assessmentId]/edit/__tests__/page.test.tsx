import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1', assessmentId: 'a1' }),
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockAssessment = {
  id: 'a1',
  project_id: 'p1',
  name: 'Q1 Audit',
  description: null,
  status: 'ready' as const,
  test_date_start: null,
  test_date_end: null,
  assigned_to: null,
  created_by: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

global.fetch = vi.fn().mockImplementation((url: string) => {
  if (typeof url === 'string' && url.includes('/assessments/a1')) {
    return Promise.resolve({ json: async () => ({ success: true, data: mockAssessment }) });
  }
  return Promise.resolve({
    json: async () => ({ success: true, data: [{ id: 'p1', name: 'My Project' }] }),
  });
});

vi.mock('@/components/assessments/delete-assessment-button', () => ({
  DeleteAssessmentButton: () => <button type="button">Delete Assessment</button>,
}));

import EditAssessmentPage from '../page';

test('renders Save button outside the card after loading', async () => {
  render(<EditAssessmentPage />);
  expect(await screen.findByRole('button', { name: /save assessment/i })).toBeInTheDocument();
});

test('renders Cancel link outside the card after loading', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });
  expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
});

test('renders DeleteAssessmentButton after loading', async () => {
  render(<EditAssessmentPage />);
  expect(await screen.findByRole('button', { name: /delete assessment/i })).toBeInTheDocument();
});

test('Save button has type=submit and form attribute', async () => {
  render(<EditAssessmentPage />);
  const saveBtn = await screen.findByRole('button', { name: /save assessment/i });
  expect(saveBtn).toHaveAttribute('type', 'submit');
  expect(saveBtn).toHaveAttribute('form', 'edit-assessment-form');
});
