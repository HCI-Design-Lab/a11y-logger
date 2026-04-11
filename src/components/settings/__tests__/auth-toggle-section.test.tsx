import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { AuthToggleSection } from '../auth-toggle-section';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const user = userEvent.setup();

const messages = {
  settings: {
    auth: {
      heading: 'Authentication',
      enable_label: 'Enable authentication',
      enable_description: 'Require a password to access this instance',
      save_button: 'Save Auth Settings',
    },
    toast: {
      auth_saved: 'Auth settings saved',
      auth_save_failed: 'Failed to save auth settings',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('AuthToggleSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables toggle and shows explanation when no users exist', () => {
    renderWithIntl(<AuthToggleSection authEnabled={false} hasUsers={false} />);
    expect(screen.getByRole('button', { name: /enable auth/i })).toBeDisabled();
    expect(screen.getByText(/create an account first/i)).toBeInTheDocument();
  });

  it('enables toggle when users exist', () => {
    renderWithIntl(<AuthToggleSection authEnabled={false} hasUsers={true} />);
    expect(screen.getByRole('button', { name: /enable auth/i })).not.toBeDisabled();
    expect(screen.queryByText(/create an account first/i)).not.toBeInTheDocument();
  });

  it('calls toggle API and updates state', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { enabled: true } }),
    });
    renderWithIntl(<AuthToggleSection authEnabled={false} hasUsers={true} />);
    await user.click(screen.getByRole('button', { name: /enable auth/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disable auth/i })).toBeInTheDocument();
    });
  });
});
