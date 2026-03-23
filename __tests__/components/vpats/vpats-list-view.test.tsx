import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VpatsListView } from '@/components/vpats/vpats-list-view';
import type { VpatWithProgress } from '@/lib/db/vpats';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/vpats/import-openacr-modal', () => ({
  ImportOpenAcrModal: () => <button>Import from OpenACR</button>,
}));

const mockVpats: VpatWithProgress[] = [
  {
    id: 'v1',
    project_id: 'p1',
    project_name: 'My Project',
    title: 'Product VPAT',
    description: null,
    standard_edition: 'WCAG',
    wcag_version: '2.1',
    wcag_level: 'AA',
    product_scope: ['web'],
    status: 'draft',
    version_number: 1,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    resolved: 0,
    total: 10,
  },
];

describe('VpatsListView', () => {
  it('defaults to table view', () => {
    render(<VpatsListView vpats={mockVpats} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to grid view', async () => {
    render(<VpatsListView vpats={mockVpats} />);
    await userEvent.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Product VPAT')).toBeInTheDocument();
  });
});
