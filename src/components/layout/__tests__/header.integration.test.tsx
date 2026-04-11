/**
 * Integration tests for Header — uses real NextIntlClientProvider so that
 * translation-key typos surface as test failures instead of being silently
 * echoed back by the unit-test mock.
 */
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// These mocks do NOT cover next-intl, so the real provider is used below.
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Stub the fetch used by handleLanguageChange
global.fetch = vi.fn().mockResolvedValue({ ok: true });

import { Header } from '@/components/layout/header';

/** Minimal messages object that mirrors the relevant keys in src/messages/en.json */
const messages = {
  ui: {
    theme_toggle: {
      light_aria_label: 'Switch to light mode',
      dark_aria_label: 'Switch to dark mode',
    },
    language_select: {
      aria_label: 'Language',
    },
  },
  settings: {
    language: {
      label: 'Language',
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
    },
  },
};

describe('integration — real translations', () => {
  it('resolves theme toggle aria-label from translation catalog (dark theme → light mode label)', async () => {
    // theme mock returns 'dark', so isDark becomes true after mount → aria-label = light_aria_label
    await act(async () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Header />
        </NextIntlClientProvider>
      );
    });

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('resolves language select aria-label from translation catalog', async () => {
    await act(async () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <Header />
        </NextIntlClientProvider>
      );
    });

    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
  });
});
