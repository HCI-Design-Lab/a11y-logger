import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}));

const MockSelectCtx = React.createContext<{
  ariaLabel?: string;
  id?: string;
  setMeta: (m: { ariaLabel?: string; id?: string }) => void;
}>({ setMeta: () => {} });

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => {
    const [meta, setMeta] = React.useState<{ ariaLabel?: string; id?: string }>({});
    return (
      <MockSelectCtx.Provider value={{ ...meta, setMeta }}>
        <select
          role="combobox"
          aria-label={meta.ariaLabel}
          id={meta.id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {children}
        </select>
      </MockSelectCtx.Provider>
    );
  },
  SelectTrigger: ({
    'aria-label': ariaLabel,
    id,
  }: {
    children?: React.ReactNode;
    'aria-label'?: string;
    id?: string;
  }) => {
    const { setMeta } = React.useContext(MockSelectCtx);
    React.useEffect(() => {
      setMeta({ ariaLabel, id });
    }, [ariaLabel, id, setMeta]);
    return null;
  },
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Mock next-intl — returns the translation key as the display string
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { Header } from '@/components/layout/header';

test('renders app wordmark', () => {
  render(<Header />);
  expect(screen.getByText('A11y Logger')).toBeInTheDocument();
});

test('renders logo icon with aria-hidden', () => {
  render(<Header />);
  const svg = document.querySelector('svg[aria-hidden="true"]');
  expect(svg).toBeInTheDocument();
});

test('theme toggle button renders with translated aria-label for light mode (dark theme active)', () => {
  // theme is 'dark' in mock, so isDark=true → aria-label = t('theme_toggle.light_aria_label')
  render(<Header />);
  expect(screen.getByRole('button', { name: 'theme_toggle.light_aria_label' })).toBeInTheDocument();
});

test('clicking theme toggle calls setTheme with opposite theme', () => {
  render(<Header />);
  fireEvent.click(screen.getByRole('button', { name: 'theme_toggle.light_aria_label' }));
  expect(mockSetTheme).toHaveBeenCalledWith('light');
});

test('theme toggle indicates current pressed state', () => {
  render(<Header />);
  // theme is 'dark' in mock, so aria-pressed should be true
  expect(screen.getByRole('button', { name: 'theme_toggle.light_aria_label' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('language select renders with translated aria-label', () => {
  render(<Header />);
  expect(screen.getByRole('combobox', { name: 'language_select.aria_label' })).toBeInTheDocument();
});

test('language options use translated labels', () => {
  render(<Header currentLocale="en" />);
  // After migration, option labels come from t('en'), t('fr'), etc.
  // With mock, these return 'en', 'fr', 'es', 'de'
  expect(screen.getByRole('option', { name: 'en' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'fr' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'es' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'de' })).toBeInTheDocument();
});
