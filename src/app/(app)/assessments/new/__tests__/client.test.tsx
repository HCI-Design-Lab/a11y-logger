import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Capture onSubmit so tests can call handleSubmit directly
let capturedOnSubmit: ((data: Record<string, unknown>) => Promise<void>) | undefined;
vi.mock('@/components/assessments/assessment-form', () => ({
  AssessmentForm: ({
    onSubmit,
    externalButtons,
  }: {
    onSubmit?: (data: Record<string, unknown>) => Promise<void>;
    externalButtons?: string;
  }) => {
    capturedOnSubmit = onSubmit;
    return <form id={externalButtons} data-testid="assessment-form" />;
  },
}));

import NewAssessmentClient from '../client';

const baseFormData = {
  project_id: 'p1',
  name: 'Test Assessment',
  status: 'ready',
  description: null,
  test_date_start: null,
  test_date_end: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnSubmit = undefined;
});

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

test('shows error toast when project_id is missing', async () => {
  render(<NewAssessmentClient projects={[]} />);
  await act(async () => {
    await capturedOnSubmit!({ ...baseFormData, project_id: null });
  });
  expect(toast.error).toHaveBeenCalledWith('Please select a project');
});

test('creates assessment and redirects on success', async () => {
  const push = vi.fn();
  vi.doMock('next/navigation', () => ({ useRouter: () => ({ push }) }));

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { id: 'a1' } }),
    })
  );

  render(<NewAssessmentClient projects={[{ id: 'p1', name: 'Project 1' }]} />);
  await act(async () => {
    await capturedOnSubmit!(baseFormData);
  });

  expect(fetch).toHaveBeenCalledWith(
    '/api/projects/p1/assessments',
    expect.objectContaining({ method: 'POST' })
  );
  expect(toast.success).toHaveBeenCalledWith('Assessment created');
  vi.unstubAllGlobals();
});

test('shows error toast when API returns failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    })
  );

  render(<NewAssessmentClient projects={[{ id: 'p1', name: 'Project 1' }]} />);
  await act(async () => {
    await capturedOnSubmit!(baseFormData);
  });

  expect(toast.error).toHaveBeenCalledWith('Failed to create assessment');
  vi.unstubAllGlobals();
});

test('includes description in payload when provided', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { id: 'a1' } }),
    })
  );

  render(<NewAssessmentClient projects={[{ id: 'p1', name: 'Project 1' }]} />);
  await act(async () => {
    await capturedOnSubmit!({ ...baseFormData, description: 'My description' });
  });

  const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].body);
  expect(body.description).toBe('My description');
  vi.unstubAllGlobals();
});

test('includes test dates in payload when provided', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { id: 'a1' } }),
    })
  );

  render(<NewAssessmentClient projects={[{ id: 'p1', name: 'Project 1' }]} />);
  await act(async () => {
    await capturedOnSubmit!({
      ...baseFormData,
      test_date_start: '2026-01-01',
      test_date_end: '2026-01-31',
    });
  });

  const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].body);
  expect(body.test_date_start).toBeDefined();
  expect(body.test_date_end).toBeDefined();
  vi.unstubAllGlobals();
});
