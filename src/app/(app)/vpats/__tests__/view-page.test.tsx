import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import VpatDetailPage from '../[id]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'vpat-1' }),
}));

const mockVpat = {
  id: 'vpat-1',
  title: 'Test VPAT',
  status: 'draft',
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  project_id: 'proj-1',
  version_number: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  published_at: null,
  reviewed_by: null,
  reviewed_at: null,
  criterion_rows: [
    {
      id: 'row-1',
      vpat_id: 'vpat-1',
      criterion_id: 'c1',
      criterion_code: '1.1.1',
      criterion_name: 'Non-text Content',
      criterion_description: 'All non-text content has a text alternative.',
      criterion_level: 'A',
      criterion_section: 'A',
      conformance: 'not_evaluated',
      remarks: null,
      ai_confidence: null,
      ai_reasoning: null,
      ai_referenced_issues: null,
      ai_suggested_conformance: null,
      last_generated_at: null,
      updated_at: '2026-01-01',
      issue_count: 0,
    },
    {
      id: 'row-2',
      vpat_id: 'vpat-1',
      criterion_id: 'c2',
      criterion_code: '1.4.3',
      criterion_name: 'Contrast (Minimum)',
      criterion_description: 'Text has sufficient contrast.',
      criterion_level: 'AA',
      criterion_section: 'AA',
      conformance: 'supports',
      remarks: 'Good contrast throughout.',
      ai_confidence: null,
      ai_reasoning: null,
      ai_referenced_issues: null,
      ai_suggested_conformance: null,
      last_generated_at: null,
      updated_at: '2026-01-01',
      issue_count: 0,
    },
  ],
};

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (url.includes('/versions')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: mockVpat }),
    } as unknown as Response);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VpatDetailPage (view)', () => {
  it('shows VPAT title after loading', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test VPAT' })).toBeInTheDocument();
    });
  });

  it('shows edition badge', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/WCAG 2\.1/i)).toBeInTheDocument();
    });
  });

  it('uses VPAT title in breadcrumbs (not hardcoded label)', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.queryByText('VPAT Detail')).not.toBeInTheDocument();
      expect(screen.getAllByText('Test VPAT').length).toBeGreaterThan(0);
    });
  });

  it('does not show Publish in settings menu (view variant)', async () => {
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /publish/i })).not.toBeInTheDocument();
    });
  });

  it('shows criteria table', async () => {
    render(<VpatDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('1.1.1')).toBeInTheDocument();
    });
  });

  it('shows reviewer block when VPAT is reviewed', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockVpat,
            status: 'reviewed',
            reviewed_by: 'Jane Smith',
            reviewed_at: '2026-03-29T10:00:00.000Z',
          },
        }),
      } as unknown as Response);
    });
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/Reviewed by Jane Smith/)).toBeInTheDocument();
    });
  });

  it('shows reviewer block when VPAT is published', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockVpat,
            status: 'published',
            reviewed_by: 'Jane Smith',
            reviewed_at: '2026-03-29T10:00:00.000Z',
          },
        }),
      } as unknown as Response);
    });
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/Reviewed by Jane Smith/)).toBeInTheDocument();
    });
  });

  it('does not show reviewer block when VPAT is draft', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test VPAT' })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Reviewed by/)).not.toBeInTheDocument();
  });

  it('shows Reviewed badge when status is reviewed', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockVpat,
            status: 'reviewed',
            reviewed_by: 'Jane Smith',
            reviewed_at: '2026-03-29T10:00:00.000Z',
          },
        }),
      } as unknown as Response);
    });
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Reviewed')).toBeInTheDocument();
    });
  });
});
