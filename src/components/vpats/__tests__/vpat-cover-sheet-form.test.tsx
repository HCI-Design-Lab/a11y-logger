import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/en.json';
import { VpatCoverSheetForm } from '@/components/vpats/vpat-cover-sheet-form';

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
});

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('VpatCoverSheetForm', () => {
  it('renders section headings via i18n', async () => {
    renderWithIntl(<VpatCoverSheetForm vpatId="v1" />);
    await waitFor(() => {
      expect(screen.getByText('Product Information')).toBeInTheDocument();
      expect(screen.getByText('Vendor / Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });
  });

  it('renders field labels via i18n', async () => {
    renderWithIntl(<VpatCoverSheetForm vpatId="v1" />);
    await waitFor(() => {
      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/report date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/evaluation methods/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });
  });

  it('shows loading text while fetching', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderWithIntl(<VpatCoverSheetForm vpatId="v1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
