import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const mockRefresh = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

// Mock next/navigation
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

// Mock fetch
global.fetch = vi.fn();

import { ImportProjectButton } from '@/components/projects/import-project-button';

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders import button', () => {
  render(<ImportProjectButton />);
  expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
});

test('has a hidden file input that accepts zip files', () => {
  render(<ImportProjectButton />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  expect(input.accept).toContain('.zip');
});

test('calls fetch with FormData on file selection', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { projectId: 'new-id' } }),
  });

  render(<ImportProjectButton />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['fake zip content'], 'export.zip', { type: 'application/zip' });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/import',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

test('shows success toast and refreshes on successful import', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { projectId: 'new-id' } }),
  });

  render(<ImportProjectButton />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['fake zip content'], 'export.zip', { type: 'application/zip' });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(mockToastSuccess).toHaveBeenCalledWith('Project imported successfully');
    expect(mockRefresh).toHaveBeenCalled();
  });
});

test('shows error toast on failed import', async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, error: 'Invalid zip' }),
  });

  render(<ImportProjectButton />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['bad content'], 'export.zip', { type: 'application/zip' });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalled();
  });
});
