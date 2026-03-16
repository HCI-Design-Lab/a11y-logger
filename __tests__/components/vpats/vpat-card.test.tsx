import { render, screen } from '@testing-library/react';
import { VpatCard } from '@/components/vpats/vpat-card';
import type { Vpat } from '@/lib/db/vpats';

const mockVpat: Vpat = {
  id: 'v1',
  project_id: 'p1',
  title: 'Product VPAT',
  status: 'draft',
  version_number: 2,
  wcag_scope: ['1.1.1', '1.4.3'],
  wcag_version: '2.1',
  wcag_level: 'AA',
  criteria_rows: [],
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('VpatCard', () => {
  it('renders title as a link', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vpats/v1');
    expect(screen.getByText('Product VPAT')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders version number', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('does not render a scope criteria count label', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.queryByText('2 criteria')).not.toBeInTheDocument();
    expect(screen.queryByText(/all criteria/i)).not.toBeInTheDocument();
  });

  it('shows WCAG scope badge', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.getByText(/wcag 2\.1/i)).toBeInTheDocument();
  });

  it('does not show inline Edit or Delete action buttons', () => {
    render(<VpatCard vpat={mockVpat} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
