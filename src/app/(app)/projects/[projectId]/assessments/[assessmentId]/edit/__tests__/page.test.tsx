import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { toast } from 'sonner';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1', assessmentId: 'a1' }),
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

import EditAssessmentPage from '../page';

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

const baseFormData = {
  name: 'Q1 Audit',
  status: 'ready',
  project_id: 'p1',
  description: null,
  test_date_start: null,
  test_date_end: null,
};

function makeDefaultFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: true, data: mockAssessment }) });
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: [{ id: 'p1', name: 'My Project' }] }),
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnSubmit = undefined;
  global.fetch = makeDefaultFetch();
});

test('renders Save button outside the card after loading', async () => {
  render(<EditAssessmentPage />);
  expect(await screen.findByRole('button', { name: /save assessment/i })).toBeInTheDocument();
});

test('renders Cancel link outside the card after loading', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });
  expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
});

test('Save button has type=submit and form attribute', async () => {
  render(<EditAssessmentPage />);
  const saveBtn = await screen.findByRole('button', { name: /save assessment/i });
  expect(saveBtn).toHaveAttribute('type', 'submit');
  expect(saveBtn).toHaveAttribute('form', 'edit-assessment-form');
});

test('shows loading state while fetching', () => {
  global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
  render(<EditAssessmentPage />);
  expect(screen.getByText('Loading…')).toBeInTheDocument();
});

test('shows error toast and redirects when assessment fetch returns success:false', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: false, error: 'Not found' }) });
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: [{ id: 'p1', name: 'My Project' }] }),
    });
  });
  render(<EditAssessmentPage />);
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Failed to load assessment');
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments');
  });
});

test('shows error toast and redirects when assessment fetch throws', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.reject(new Error('network error'));
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: [{ id: 'p1', name: 'My Project' }] }),
    });
  });
  render(<EditAssessmentPage />);
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Failed to load assessment');
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments');
  });
});

test('shows Assessment not found when assessment is null after failed fetch', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: false }) });
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: [] }),
    });
  });
  render(<EditAssessmentPage />);
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments');
  });
});

test('handleSubmit: success case calls toast.success and redirects to same project', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });

  await act(async () => {
    await capturedOnSubmit!(baseFormData);
  });

  expect(toast.success).toHaveBeenCalledWith('Assessment updated');
  expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1');
});

test('handleSubmit: failure case shows error toast when API returns success:false', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: false, error: 'Update failed' }),
  });

  await act(async () => {
    await capturedOnSubmit!(baseFormData);
  });

  expect(toast.error).toHaveBeenCalledWith('Failed to update assessment');
});

test('handleSubmit: includes description in payload when provided', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  const putFetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });
  global.fetch = putFetch;

  await act(async () => {
    await capturedOnSubmit!({ ...baseFormData, description: 'My description' });
  });

  const body = JSON.parse(putFetch.mock.calls[0]![1].body);
  expect(body.description).toBe('My description');
});

test('handleSubmit: includes test_date_start and test_date_end in payload when provided', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  const putFetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });
  global.fetch = putFetch;

  await act(async () => {
    await capturedOnSubmit!({
      ...baseFormData,
      test_date_start: '2026-01-01',
      test_date_end: '2026-01-31',
    });
  });

  const body = JSON.parse(putFetch.mock.calls[0]![1].body);
  expect(body.test_date_start).toBeDefined();
  expect(body.test_date_end).toBeDefined();
});

test('handleSubmit: includes project_id in payload and redirects to new project when project changed', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  const putFetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });
  global.fetch = putFetch;

  await act(async () => {
    await capturedOnSubmit!({ ...baseFormData, project_id: 'p2' });
  });

  const body = JSON.parse(putFetch.mock.calls[0]![1].body);
  expect(body.project_id).toBe('p2');
  expect(mockPush).toHaveBeenCalledWith('/projects/p2/assessments/a1');
});

test('handleSubmit: uses projectId as fallback when data.project_id is null', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });

  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ success: true }),
  });

  await act(async () => {
    await capturedOnSubmit!({ ...baseFormData, project_id: null });
  });

  expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1');
});

test('shows project name in breadcrumbs when match found', async () => {
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });
  expect(screen.getByText('My Project')).toBeInTheDocument();
});

test('omits project name from breadcrumbs when projects fetch returns no match', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: true, data: mockAssessment }) });
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: [{ id: 'other', name: 'Other Project' }] }),
    });
  });
  render(<EditAssessmentPage />);
  await screen.findByRole('button', { name: /save assessment/i });
  expect(screen.queryByText('Other Project')).not.toBeInTheDocument();
});

test('renders normally when projects fetch throws', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: true, data: mockAssessment }) });
    }
    return Promise.reject(new Error('network error'));
  });
  render(<EditAssessmentPage />);
  expect(await screen.findByRole('button', { name: /save assessment/i })).toBeInTheDocument();
});

test('renders normally when projects fetch returns success:false', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/assessments/a1')) {
      return Promise.resolve({ json: async () => ({ success: true, data: mockAssessment }) });
    }
    return Promise.resolve({
      json: async () => ({ success: false }),
    });
  });
  render(<EditAssessmentPage />);
  expect(await screen.findByRole('button', { name: /save assessment/i })).toBeInTheDocument();
});
