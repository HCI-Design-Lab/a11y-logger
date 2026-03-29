import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/vpats/vpat-card', () => ({
  VpatCard: () => <div data-testid="vpat-card" />,
}));

import { VpatsListView } from '../vpats-list-view';

describe('VpatsListView layout', () => {
  it('renders the New VPAT link', () => {
    render(<VpatsListView vpats={[]} />);
    expect(screen.getByRole('link', { name: /new vpat/i })).toBeInTheDocument();
  });

  it('wraps heading in a labelled section', () => {
    render(<VpatsListView vpats={[]} />);
    const heading = screen.getByRole('heading', { name: 'VPATs' });
    expect(heading).toHaveAttribute('id', 'vpats-heading');
    const section = heading.closest('section')!;
    expect(section).toHaveAttribute('aria-labelledby', 'vpats-heading');
  });

  it('ViewToggle is in the header row with the New VPAT button', () => {
    render(<VpatsListView vpats={[]} />);
    const heading = screen.getByRole('heading', { name: 'VPATs' });
    const headerRow = heading.closest('div')!;
    const viewGroup = screen.getByRole('group', { name: 'View options' });
    expect(headerRow).toContainElement(viewGroup);
  });

  it('does not render an Import from OpenACR button', () => {
    render(<VpatsListView vpats={[]} />);
    expect(screen.queryByRole('button', { name: /import from openacr/i })).not.toBeInTheDocument();
  });
});
