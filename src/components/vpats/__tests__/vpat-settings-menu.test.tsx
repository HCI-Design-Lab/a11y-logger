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
vi.mock('../pdf-export-modal', () => ({
  PdfExportModal: ({ open }: { open: boolean }) => (open ? <div data-testid="pdf-modal" /> : null),
}));
global.fetch = vi.fn();

import { VpatSettingsMenu } from '../vpat-settings-menu';

const baseProps = {
  vpatId: 'vpat-1',
  vpatTitle: 'Test VPAT',
  status: 'draft' as const,
  resolvedCount: 2,
  totalCount: 2,
  isPublishing: false,
  isReviewing: false,
  onPublish: vi.fn(),
  onUnpublish: vi.fn(),
  onReview: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('VpatSettingsMenu', () => {
  it('renders a settings trigger button', () => {
    render(<VpatSettingsMenu {...baseProps} />);
    expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
  });

  it('shows Publish option when draft', async () => {
    render(<VpatSettingsMenu {...baseProps} status="draft" />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('clicking Publish opens confirmation dialog', async () => {
    render(<VpatSettingsMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /vpat settings/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('confirming publish calls onPublish prop', async () => {
    const onPublish = vi.fn();
    render(<VpatSettingsMenu {...baseProps} status="reviewed" onPublish={onPublish} />);
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

  it('shows Publish option when status is draft', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="draft" variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('shows Publish option when status is reviewed', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="reviewed" variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('clicking Publish when notEvaluated > 0 shows a not-ready modal', async () => {
    const user = userEvent.setup();
    render(
      <VpatSettingsMenu
        {...baseProps}
        status="draft"
        resolvedCount={1}
        totalCount={3}
        variant="view"
      />
    );
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /publish/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/criteria must be evaluated/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewed/i)).toBeInTheDocument();
  });

  it('clicking Publish when all evaluated shows the publish confirmation', async () => {
    const user = userEvent.setup();
    render(
      <VpatSettingsMenu
        {...baseProps}
        status="reviewed"
        resolvedCount={2}
        totalCount={2}
        variant="view"
      />
    );
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /publish/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/publish vpat/i)).toBeInTheDocument();
  });
});

describe('VpatSettingsMenu variant="edit"', () => {
  it('shows Publish option when draft', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="draft" variant="edit" />);
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
    render(<VpatSettingsMenu {...baseProps} status="draft" onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    const editItem = screen.getByRole('menuitem', { name: /edit vpat/i });
    expect(editItem.tagName.toLowerCase()).toBe('a');
  });

  it('shows confirmation dialog when published and Edit VPAT clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<VpatSettingsMenu {...baseProps} status="published" onEdit={onEdit} variant="view" />);
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
    render(<VpatSettingsMenu {...baseProps} status="published" onEdit={onEdit} variant="view" />);
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
    render(<VpatSettingsMenu {...baseProps} status="published" onEdit={onEdit} variant="view" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit vpat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onEdit).not.toHaveBeenCalled();
  });
});

describe('VpatSettingsMenu Review item', () => {
  it('shows "Mark as Reviewed" when status is draft', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="draft" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /mark as reviewed/i })).toBeInTheDocument();
  });

  it('shows "Update Review" when status is reviewed', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="reviewed" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /update review/i })).toBeInTheDocument();
  });

  it('shows "Update Review" when status is published', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="published" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /update review/i })).toBeInTheDocument();
  });

  it('clicking review when notEvaluated > 0 opens not-ready alert', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} resolvedCount={1} totalCount={3} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/2 of 3 criteria are not yet evaluated/i)).toBeInTheDocument();
  });

  it('clicking review when all evaluated opens confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} resolvedCount={3} totalCount={3} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/all 3 criteria have been evaluated/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /reviewer full name/i })).toBeInTheDocument();
  });

  it('confirming review calls onReview with reviewer name', async () => {
    const onReview = vi.fn();
    const user = userEvent.setup();
    render(
      <VpatSettingsMenu {...baseProps} resolvedCount={2} totalCount={2} onReview={onReview} />
    );
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    await user.type(screen.getByRole('textbox', { name: /reviewer full name/i }), 'Jane Smith');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    expect(onReview).toHaveBeenCalledWith('Jane Smith');
  });
});

describe('VpatSettingsMenu Unpublish item', () => {
  it('shows "Unpublish" when status is published', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="published" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('shows "Publish" when status is draft', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="draft" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /^publish$/i })).toBeInTheDocument();
  });

  it('clicking Unpublish opens unpublish confirmation', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="published" />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /unpublish/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/reset.*draft/i)).toBeInTheDocument();
  });

  it('confirming unpublish calls onUnpublish', async () => {
    const onUnpublish = vi.fn();
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="published" onUnpublish={onUnpublish} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /unpublish/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^unpublish$/i }));
    expect(onUnpublish).toHaveBeenCalledOnce();
  });
});

describe('VpatSettingsMenu Publish count line', () => {
  it('not-ready publish dialog shows count when notEvaluated > 0', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="draft" resolvedCount={1} totalCount={4} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /^publish$/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/3 of 4 criteria are not yet evaluated/i)).toBeInTheDocument();
  });

  it('publish confirm dialog shows "all evaluated" when resolvedCount === totalCount', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} status="reviewed" resolvedCount={4} totalCount={4} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /^publish$/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/all 4 criteria have been evaluated/i)).toBeInTheDocument();
  });
});

describe('PDF export', () => {
  it('shows a "Print to PDF…" menu item', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /print to pdf/i })).toBeInTheDocument();
  });

  it('clicking "Print to PDF…" opens the PDF modal', async () => {
    const user = userEvent.setup();
    render(<VpatSettingsMenu {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /print to pdf/i }));
    expect(screen.getByTestId('pdf-modal')).toBeInTheDocument();
  });
});
