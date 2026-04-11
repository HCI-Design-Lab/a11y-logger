import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { VpatCard } from '@/components/vpats/vpat-card';
import type { VpatWithProgress } from '@/lib/db/vpats';
import messages from '@/messages/en.json';

const makeVpat = (overrides: Partial<VpatWithProgress> = {}): VpatWithProgress => ({
  id: 'v1',
  project_id: 'p1',
  project_name: 'Acme App',
  title: 'My VPAT',
  description: null,
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  status: 'draft',
  version_number: 1,
  published_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  resolved: 3,
  total: 12,
  ...overrides,
});

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('VpatCard', () => {
  it('shows title', () => {
    renderWithIntl(<VpatCard vpat={makeVpat()} />);
    expect(screen.getByText('My VPAT')).toBeInTheDocument();
  });

  it('shows project name', () => {
    renderWithIntl(<VpatCard vpat={makeVpat()} />);
    expect(screen.getByText('Acme App')).toBeInTheDocument();
  });

  it('shows edition label for WCAG', () => {
    renderWithIntl(<VpatCard vpat={makeVpat()} />);
    expect(screen.getByText('WCAG 2.1 · AA')).toBeInTheDocument();
  });

  it('shows edition label for 508', () => {
    renderWithIntl(<VpatCard vpat={makeVpat({ standard_edition: '508' })} />);
    expect(screen.getByText('Section 508')).toBeInTheDocument();
  });

  it('shows progress count via i18n', () => {
    renderWithIntl(<VpatCard vpat={makeVpat()} />);
    expect(screen.getByText('3 of 12 criteria resolved')).toBeInTheDocument();
  });

  it('shows Draft badge when status is draft', () => {
    renderWithIntl(<VpatCard vpat={makeVpat()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows Published badge when status is published', () => {
    renderWithIntl(<VpatCard vpat={makeVpat({ status: 'published' })} />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows fallback when project_name is null via i18n', () => {
    renderWithIntl(<VpatCard vpat={makeVpat({ project_name: null })} />);
    expect(screen.getByText('No project')).toBeInTheDocument();
  });
});
