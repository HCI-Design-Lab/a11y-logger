import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock next-intl — returns the translation key as the display string
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Capture window.open calls
const mockWindowOpen = vi.fn();
const mockPrint = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  global.window.open = mockWindowOpen;
});

import { PdfExportModal } from '../pdf-export-modal';

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  vpatId: 'vpat-1',
};

describe('PdfExportModal', () => {
  it('renders the dialog title when open', () => {
    render(<PdfExportModal {...baseProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders the browser PDF warning paragraph', () => {
    render(<PdfExportModal {...baseProps} />);
    expect(screen.getByText('browser_warning')).toBeInTheDocument();
  });

  it('renders the accessible PDF paragraph', () => {
    render(<PdfExportModal {...baseProps} />);
    expect(screen.getByText('accessible_alternative')).toBeInTheDocument();
  });

  it('renders "Continue to Print" and "Download DOCX instead" buttons', () => {
    render(<PdfExportModal {...baseProps} />);
    expect(screen.getByRole('button', { name: 'continue_to_print' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'download_docx' })).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<PdfExportModal {...baseProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Continue to Print" fetches HTML export and opens print dialog', async () => {
    const mockNewWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      print: mockPrint,
      focus: vi.fn(),
      addEventListener: vi.fn(),
    };
    mockWindowOpen.mockReturnValue(mockNewWindow);
    const htmlBlob = new Blob(['<html></html>'], { type: 'text/html' });
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(htmlBlob),
    } as unknown as Response);

    render(<PdfExportModal {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: 'continue_to_print' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/vpats/vpat-1/export?format=html');
    });
    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalled();
    });
  });

  it('"Download DOCX instead" navigates to DOCX export URL and closes modal', async () => {
    const onOpenChange = vi.fn();
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: '' };

    render(<PdfExportModal {...baseProps} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'download_docx' }));

    expect((window as unknown as { location: { href: string } }).location.href).toBe(
      '/api/vpats/vpat-1/export?format=docx'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
