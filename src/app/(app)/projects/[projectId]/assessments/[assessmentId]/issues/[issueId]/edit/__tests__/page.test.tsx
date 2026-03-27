import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPush, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ projectId: 'p1', assessmentId: 'a1', issueId: 'i1' }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));
vi.mock('@/components/issues/issue-form', () => ({
  IssueForm: ({
    onSubmit,
    externalButtons,
    loading,
  }: {
    onSubmit: (data: Record<string, unknown>) => void;
    externalButtons?: string;
    loading?: boolean;
  }) => (
    <form
      id={externalButtons}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title: 'Test' });
      }}
    >
      <span data-testid="form-loading">{loading ? 'loading' : 'idle'}</span>
    </form>
  ),
}));
vi.mock('@/components/issues/delete-issue-button', () => ({
  DeleteIssueButton: ({ issueId }: { issueId: string }) => (
    <button data-testid={`delete-${issueId}`}>Delete</button>
  ),
}));

global.fetch = vi.fn();

import EditIssuePage from '../page';

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url.includes('/issues/i1')) {
      return Promise.resolve({
        json: async () => ({
          success: true,
          data: {
            id: 'i1',
            title: 'Missing alt text',
            severity: 'high',
            status: 'open',
            wcag_codes: [],
            section_508_codes: [],
            eu_codes: [],
            tags: [],
            evidence_media: [],
          },
        }),
      });
    }
    if (url.includes('/assessments/a1') && !url.includes('/issues/')) {
      return Promise.resolve({
        json: async () => ({ success: true, data: { name: 'Q1 Audit' } }),
      });
    }
    return Promise.resolve({
      json: async () => ({ success: true, data: { name: 'My Project' } }),
    });
  });
});

describe('EditIssuePage', () => {
  it('renders the Edit Issue heading', async () => {
    render(<EditIssuePage />);
    expect(await screen.findByRole('heading', { name: /edit issue/i })).toBeInTheDocument();
  });

  it('renders a Cancel button linking back to the issue detail page', async () => {
    render(<EditIssuePage />);
    await screen.findByRole('heading', { name: /edit issue/i });
    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/projects/p1/assessments/a1/issues/i1');
  });

  it('renders a Save Issue submit button with form attribute', async () => {
    render(<EditIssuePage />);
    await screen.findByRole('heading', { name: /edit issue/i });
    const saveBtn = screen.getByRole('button', { name: /save issue/i });
    expect(saveBtn).toHaveAttribute('type', 'submit');
    expect(saveBtn).toHaveAttribute('form', 'edit-issue-form');
  });

  it('renders the DeleteIssueButton in the external button bar', async () => {
    render(<EditIssuePage />);
    await screen.findByRole('heading', { name: /edit issue/i });
    expect(screen.getByTestId('delete-i1')).toBeInTheDocument();
  });

  it('Save Issue button has an icon', async () => {
    render(<EditIssuePage />);
    await screen.findByRole('heading', { name: /edit issue/i });
    const btn = screen.getByRole('button', { name: /save issue/i });
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('Cancel button has an icon', async () => {
    render(<EditIssuePage />);
    await screen.findByRole('heading', { name: /edit issue/i });
    const link = screen.getByRole('link', { name: /cancel/i });
    expect(link.querySelector('svg')).toBeInTheDocument();
  });
});
