import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EditVpatPage from '../[id]/edit/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'v1' }),
}));

describe('EditVpatPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'v1',
            title: 'Test VPAT',
            status: 'draft',
            wcag_version: '2.1',
            wcag_level: 'AA',
            wcag_scope: [],
            criteria_rows: [],
            project_id: 'p1',
          },
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows locked scope badge after loading', async () => {
    render(<EditVpatPage />);
    expect(await screen.findByText(/wcag 2\.1/i)).toBeInTheDocument();
    expect(screen.getByText(/level aa/i)).toBeInTheDocument();
  });

  it('shows Generate All button', async () => {
    render(<EditVpatPage />);
    expect(await screen.findByRole('button', { name: /generate all/i })).toBeInTheDocument();
  });

  it('shows title input with existing value', async () => {
    render(<EditVpatPage />);
    const input = await screen.findByRole('textbox', { name: /title/i });
    expect(input).toHaveValue('Test VPAT');
  });
});
