/**
 * Integration tests for Sidebar — uses real NextIntlClientProvider so that
 * translation-key typos surface as test failures instead of being silently
 * echoed back by the unit-test mock.
 */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { Sidebar } from '@/components/layout/sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

/** Minimal nav messages that mirror src/messages/en.json nav namespace */
const messages = {
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    assessments: 'Assessments',
    issues: 'Issues',
    reports: 'Reports',
    vpats: 'VPATs',
    settings: 'Settings',
  },
};

describe('integration — real translations', () => {
  it('renders all 7 nav labels from the translation catalog', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /assessments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /issues/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /vpats/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it('resolves "Dashboard" from translation catalog (not a hardcoded string)', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('resolves all nav label text values from translation catalog', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Assessments')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('VPATs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('uses translation key for aria-label (dashboard link)', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>
    );
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('aria-label', 'Dashboard');
  });
});
