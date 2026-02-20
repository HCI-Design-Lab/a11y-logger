import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthToggleSection } from '@/components/settings/auth-toggle-section';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

test('renders the authentication card', () => {
  render(<AuthToggleSection authEnabled={false} />);
  expect(screen.getByText('Authentication')).toBeInTheDocument();
});

test('shows enable auth button when disabled', () => {
  render(<AuthToggleSection authEnabled={false} />);
  expect(screen.getByRole('button', { name: /enable auth/i })).toBeInTheDocument();
});

test('shows disable auth button when enabled', () => {
  render(<AuthToggleSection authEnabled={true} />);
  expect(screen.getByRole('button', { name: /disable auth/i })).toBeInTheDocument();
});

test('calls toggle API on button click', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: { enabled: true } }),
  } as Response);

  render(<AuthToggleSection authEnabled={false} />);
  fireEvent.click(screen.getByRole('button', { name: /enable auth/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/toggle',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
