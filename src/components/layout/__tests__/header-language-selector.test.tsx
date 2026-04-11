/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../header';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// Mock fetch for settings API
global.fetch = vi.fn();

describe('Header language selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
  });

  it('renders a language selector button', () => {
    render(<Header currentLocale="en" />);
    expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument();
  });

  it('shows English as the selected option when locale is en', () => {
    render(<Header currentLocale="en" />);
    // With next-intl mock, t('en') returns the key 'en' as the option label
    expect(screen.getByDisplayValue('en')).toBeInTheDocument();
  });

  it('shows Français as the selected option when locale is fr', () => {
    render(<Header currentLocale="fr" />);
    expect(screen.getByDisplayValue('fr')).toBeInTheDocument();
  });

  it('shows Español as the selected option when locale is es', () => {
    render(<Header currentLocale="es" />);
    expect(screen.getByDisplayValue('es')).toBeInTheDocument();
  });

  it('shows Deutsch as the selected option when locale is de', () => {
    render(<Header currentLocale="de" />);
    expect(screen.getByDisplayValue('de')).toBeInTheDocument();
  });

  it('calls settings API and router.refresh when language changes', async () => {
    render(<Header currentLocale="en" />);
    const select = screen.getByRole('combobox', { name: /language/i });
    fireEvent.change(select, { target: { value: 'fr' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/language',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ value: 'fr' }),
        })
      );
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
