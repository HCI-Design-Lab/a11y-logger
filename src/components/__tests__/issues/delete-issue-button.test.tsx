import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Mock fetch
global.fetch = vi.fn();

import { DeleteIssueButton } from '@/components/issues/delete-issue-button';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders the Delete trigger button', () => {
  render(
    <DeleteIssueButton
      projectId="p1"
      assessmentId="a1"
      issueId="i1"
      issueTitle="Missing alt text"
    />
  );
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
});

test('shows the issue title in the confirmation dialog', async () => {
  render(
    <DeleteIssueButton
      projectId="p1"
      assessmentId="a1"
      issueId="i1"
      issueTitle="Missing alt text"
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(await screen.findByText(/missing alt text/i)).toBeInTheDocument();
});

test('calls the correct DELETE API endpoint on confirm', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });

  render(
    <DeleteIssueButton
      projectId="p1"
      assessmentId="a1"
      issueId="i1"
      issueTitle="Missing alt text"
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete issue/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1/issues/i1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

test('redirects to issues list on success', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });

  render(
    <DeleteIssueButton
      projectId="p1"
      assessmentId="a1"
      issueId="i1"
      issueTitle="Missing alt text"
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete issue/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/projects/p1/assessments/a1/issues');
  });
});

test('shows an error toast on API failure', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: false }),
  });

  render(
    <DeleteIssueButton
      projectId="p1"
      assessmentId="a1"
      issueId="i1"
      issueTitle="Missing alt text"
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));
  const confirmButton = await screen.findByRole('button', { name: /delete issue/i });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalled();
  });
});
