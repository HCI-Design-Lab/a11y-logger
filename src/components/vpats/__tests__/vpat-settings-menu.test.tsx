import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPush, mockRefresh, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
vi.mock('sonner', () => ({ toast: { success: mockToastSuccess, error: mockToastError } }));
global.fetch = vi.fn();

import { VpatSettingsMenu } from '../vpat-settings-menu';

const baseProps = {
  vpatId: 'vpat-1',
  vpatTitle: 'Test VPAT',
  isPublished: false,
  canPublish: true,
  isPublishing: false,
  onPublish: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('VpatSettingsMenu', () => {
  it('renders a settings trigger button', () => {
    render(<VpatSettingsMenu {...baseProps} />);
    expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
  });

  it('shows Publish option when draft', async () => {
    render(<VpatSettingsMenu {...baseProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('Publish option is disabled when canPublish is false', async () => {
    render(<VpatSettingsMenu {...baseProps} canPublish={false} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toHaveAttribute('data-disabled');
  });

  it('does not show Publish option when already published', async () => {
    render(<VpatSettingsMenu {...baseProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.queryByRole('menuitem', { name: /^publish$/i })).not.toBeInTheDocument();
  });

  it('clicking Publish opens confirmation dialog', async () => {
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirming publish calls onPublish prop', async () => {
    const onPublish = vi.fn();
    render(<VpatSettingsMenu {...baseProps} onPublish={onPublish} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    await userEvent.click(screen.getByRole('button', { name: /^publish$/i }));
    expect(onPublish).toHaveBeenCalled();
  });

  it('shows export links in the dropdown', async () => {
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /html/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /word/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /openacr/i })).toBeInTheDocument();
  });

  it('shows Delete option', async () => {
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('clicking Delete opens confirmation dialog', async () => {
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirming delete calls DELETE /api/vpats/vpat-1 and redirects', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vpats/vpat-1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockPush).toHaveBeenCalledWith('/vpats');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast and does not redirect when delete API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Server error' }),
    });
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Server error');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
