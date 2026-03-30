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

describe('VpatSettingsMenu variant="view"', () => {
  it('shows Edit VPAT link', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /edit vpat/i })).toBeInTheDocument();
  });

  it('shows Publish option when canPublish is true', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} canPublish={true} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('does not show Publish option when canPublish is false', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} canPublish={false} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.queryByRole('menuitem', { name: /publish/i })).not.toBeInTheDocument();
  });
});

describe('VpatSettingsMenu variant="edit"', () => {
  it('shows Publish option when draft', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} canPublish={true} variant="edit" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('does not show Edit VPAT link', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} variant="edit" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.queryByRole('menuitem', { name: /edit vpat/i })).not.toBeInTheDocument();
  });
});

describe('VpatSettingsMenu Edit VPAT behavior', () => {
  it('renders Edit VPAT as a link when not published', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<VpatSettingsMenu {...baseProps} isPublished={false} onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    const editItem = screen.getByRole('menuitem', { name: /edit vpat/i });
    expect(editItem.tagName.toLowerCase()).toBe('a');
  });

  it('shows confirmation dialog when published and Edit VPAT clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<VpatSettingsMenu {...baseProps} isPublished={true} onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit vpat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/Edit Published VPAT/i)).toBeInTheDocument();
    });
  });

  it('calls onEdit when Edit Anyway confirmed', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<VpatSettingsMenu {...baseProps} isPublished={true} onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit vpat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /edit anyway/i }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('does not call onEdit when Cancel clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<VpatSettingsMenu {...baseProps} isPublished={true} onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit vpat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
