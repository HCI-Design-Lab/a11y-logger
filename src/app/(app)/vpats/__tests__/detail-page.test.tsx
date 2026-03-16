import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock DB modules (server component reads DB directly)
vi.mock('@/lib/db/vpats', () => ({
  getVpat: vi.fn().mockReturnValue({
    id: 'v1',
    title: 'Test VPAT',
    status: 'draft',
    wcag_version: '2.1',
    wcag_level: 'AA',
    wcag_scope: [],
    criteria_rows: [],
    version_number: 1,
    project_id: 'p1',
    ai_generated: 0,
    created_by: null,
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }),
}));
vi.mock('@/lib/db/projects', () => ({
  getProject: vi.fn().mockReturnValue({
    id: 'p1',
    name: 'My Project',
    description: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }),
}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: vi.fn().mockReturnValue('/vpats/v1'),
}));

import VpatDetailPage from '../[id]/page';

describe('VpatDetailPage', () => {
  it('shows WCAG version in scope badge', async () => {
    const page = await VpatDetailPage({ params: Promise.resolve({ id: 'v1' }) });
    render(page);
    expect(screen.getByText(/wcag 2\.1/i)).toBeInTheDocument();
  });

  it('shows conformance level in scope badge', async () => {
    const page = await VpatDetailPage({ params: Promise.resolve({ id: 'v1' }) });
    render(page);
    // The badge shows "WCAG 2.1 · Level AA"; table headings may also include "Level AA"
    const matches = screen.getAllByText(/level aa/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows Export button', async () => {
    const page = await VpatDetailPage({ params: Promise.resolve({ id: 'v1' }) });
    render(page);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });
});
