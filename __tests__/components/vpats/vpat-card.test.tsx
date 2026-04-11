import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { VpatCard } from '@/components/vpats/vpat-card';
import type { VpatWithProgress } from '@/lib/db/vpats';
import messages from '@/messages/en.json';

const mockVpat: VpatWithProgress = {
  id: 'v1',
  project_id: 'p1',
  project_name: 'Acme App',
  title: 'Product VPAT',
  description: null,
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  status: 'draft',
  version_number: 2,
  published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  reviewed_by: null,
  reviewed_at: null,
  resolved: 2,
  total: 5,
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('VpatCard', () => {
  it('renders title as a link', () => {
    renderWithIntl(<VpatCard vpat={mockVpat} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vpats/v1');
    expect(screen.getByText('Product VPAT')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderWithIntl(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders edition label', () => {
    renderWithIntl(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('WCAG 2.1 · AA')).toBeInTheDocument();
  });

  it('renders progress count', () => {
    renderWithIntl(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('2 of 5 criteria resolved')).toBeInTheDocument();
  });

  it('renders project name', () => {
    renderWithIntl(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('Acme App')).toBeInTheDocument();
  });
});
