import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementSection } from '../user-management-section';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const user = userEvent.setup();

const mockUser = {
  id: 'user-1',
  username: 'lawrence',
  role: 'admin' as const,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('UserManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('no users (setup state)', () => {
    it('shows create account form', () => {
      render(<UserManagementSection users={[]} />);
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows validation error when passwords do not match', async () => {
      render(<UserManagementSection users={[]} />);
      await user.type(screen.getByLabelText(/username/i), 'admin');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different');
      await user.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('shows validation error when password is too short', async () => {
      render(<UserManagementSection users={[]} />);
      await user.type(screen.getByLabelText(/username/i), 'admin');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls POST /api/users on valid submit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });
      render(<UserManagementSection users={[]} />);
      await user.type(screen.getByLabelText(/username/i), 'lawrence');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'lawrence', password: 'password123', role: 'admin' }),
        });
      });
    });

    it('shows the user info after successful creation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });
      render(<UserManagementSection users={[]} />);
      await user.type(screen.getByLabelText(/username/i), 'lawrence');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText('lawrence')).toBeInTheDocument();
      });
      expect(screen.queryByRole('heading', { name: /create account/i })).not.toBeInTheDocument();
    });

    it('shows error when username already exists', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Username already exists', code: 'CONFLICT' }),
      });
      render(<UserManagementSection users={[]} />);
      await user.type(screen.getByLabelText(/username/i), 'admin');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('has existing user', () => {
    it('shows username and role', () => {
      render(<UserManagementSection users={[mockUser]} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /create account/i })).not.toBeInTheDocument();
    });

    it('shows change password button', () => {
      render(<UserManagementSection users={[mockUser]} />);
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('shows change password form when button is clicked', async () => {
      render(<UserManagementSection users={[mockUser]} />);
      await user.click(screen.getByRole('button', { name: /change password/i }));
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('calls PUT /api/users/[id] on change password submit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });
      render(<UserManagementSection users={[mockUser]} />);
      await user.click(screen.getByRole('button', { name: /change password/i }));
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /^save password$/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/user-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'newpassword123' }),
        });
      });
    });

    it('hides form and shows success after password change', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });
      render(<UserManagementSection users={[mockUser]} />);
      await user.click(screen.getByRole('button', { name: /change password/i }));
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /^save password$/i }));
      await waitFor(() => {
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      });
    });

    it('shows validation error when new passwords do not match', async () => {
      render(<UserManagementSection users={[mockUser]} />);
      await user.click(screen.getByRole('button', { name: /change password/i }));
      await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different');
      await user.click(screen.getByRole('button', { name: /^save password$/i }));
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
