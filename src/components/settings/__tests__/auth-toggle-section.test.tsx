import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthToggleSection } from '../auth-toggle-section';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const user = userEvent.setup();

describe('AuthToggleSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables toggle and shows explanation when no users exist', () => {
    render(<AuthToggleSection authEnabled={false} hasUsers={false} />);
    expect(screen.getByRole('button', { name: /enable auth/i })).toBeDisabled();
    expect(screen.getByText(/create an account first/i)).toBeInTheDocument();
  });

  it('enables toggle when users exist', () => {
    render(<AuthToggleSection authEnabled={false} hasUsers={true} />);
    expect(screen.getByRole('button', { name: /enable auth/i })).not.toBeDisabled();
    expect(screen.queryByText(/create an account first/i)).not.toBeInTheDocument();
  });

  it('calls toggle API and updates state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { enabled: true } }),
    });
    render(<AuthToggleSection authEnabled={false} hasUsers={true} />);
    await user.click(screen.getByRole('button', { name: /enable auth/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disable auth/i })).toBeInTheDocument();
    });
  });
});
