import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const mockRefresh = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: mockToastError },
}));

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

test('shows error toast when selected file is not a valid zip', async () => {
  const { fireEvent, waitFor } = await import('@testing-library/react');

  render(<ImportProjectButton />);

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['bad content'], 'export.zip', { type: 'application/zip' });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalled();
  });
});
