import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/vpats/vpat-card', () => ({
  VpatCard: () => <div data-testid="vpat-card" />,
}));

vi.mock('@/components/vpats/import-openacr-modal', () => ({
  ImportOpenAcrModal: () => <button>Import from OpenACR</button>,
}));

import { VpatsListView } from '../vpats-list-view';

describe('VpatsListView layout', () => {
  it('renders the New VPAT link', () => {
    render(<VpatsListView vpats={[]} />);
    expect(screen.getByRole('link', { name: /new vpat/i })).toBeInTheDocument();
  });

  it('ViewToggle is not in the header row with the New VPAT button', () => {
    render(<VpatsListView vpats={[]} />);
    const heading = screen.getByRole('heading', { name: 'VPATs' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).not.toContainElement(viewGroup);
  });

  it('ViewToggle is rendered on the page', () => {
    render(<VpatsListView vpats={[]} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });
});
