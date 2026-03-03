import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VpatsListView } from '@/components/vpats/vpats-list-view';
import type { Vpat } from '@/lib/db/vpats';

const mockVpats: Vpat[] = [
  {
    id: 'v1',
    project_id: 'p1',
    title: 'Product VPAT',
    status: 'draft',
    version_number: 1,
    wcag_scope: [],
    criteria_rows: [],
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
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
