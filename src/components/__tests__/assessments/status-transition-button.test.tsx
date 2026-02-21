import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
// Mock fetch
global.fetch = vi.fn();

import { StatusTransitionButton } from '@/components/assessments/status-transition-button';

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders "Mark as In Progress" when currentStatus is planning', () => {
  render(<StatusTransitionButton projectId="p1" assessmentId="a1" currentStatus="planning" />);
  expect(screen.getByRole('button', { name: /mark as in progress/i })).toBeInTheDocument();
});

test('renders "Mark as Complete" when currentStatus is in_progress', () => {
  render(<StatusTransitionButton projectId="p1" assessmentId="a1" currentStatus="in_progress" />);
  expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
});

test('renders nothing when currentStatus is completed', () => {
  const { container } = render(
    <StatusTransitionButton projectId="p1" assessmentId="a1" currentStatus="completed" />
  );
  expect(container.firstChild).toBeNull();
});

test('calls PUT endpoint and router.refresh() after a successful transition', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    json: async () => ({ success: true }),
  });

  render(<StatusTransitionButton projectId="p1" assessmentId="a1" currentStatus="planning" />);

  fireEvent.click(screen.getByRole('button', { name: /mark as in progress/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/assessments/a1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'in_progress' }),
      })
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
