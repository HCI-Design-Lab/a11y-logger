import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import VpatDetailPage from '../[id]/page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
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

const mockVpatAllResolved = {
  ...mockVpat,
  criterion_rows: mockVpat.criterion_rows.map(r => ({ ...r, conformance: 'supports' })),
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

  it('shows Publish in settings menu even when draft and not reviewed', async () => {
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
    });
  });

  it('clicking Publish on unreviewed VPAT shows not-ready modal', async () => {
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /publish/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/criteria must be evaluated/i)).toBeInTheDocument();
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

describe('VpatDetailPage edit published flow', () => {
  it('calls unpublish API and navigates on Edit Anyway for published VPAT', async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: vi.fn() } as unknown as ReturnType<typeof useRouter>);

    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) } as unknown as Response);
      }
      if (url.includes('/unpublish')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpat, status: 'draft' } }) } as unknown as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpat, status: 'published' } }) } as unknown as Response);
    });

    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /vpat settings/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit vpat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /edit anyway/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/vpats/vpat-1/edit');
    });
  });
});

describe('VpatDetailPage Review flow', () => {
  it('shows "Mark as Reviewed" in settings menu when draft', async () => {
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /mark as reviewed/i })).toBeInTheDocument();
  });

  it('clicking Mark as Reviewed when criteria not all evaluated shows not-ready dialog', async () => {
    const user = userEvent.setup();
    render(<VpatDetailPage />); // mockVpat has 1 not_evaluated row
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/not yet evaluated/i)).toBeInTheDocument();
  });

  it('clicking Mark as Reviewed when all evaluated shows review confirm with reviewer input', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) } as unknown as Response);
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockVpatAllResolved }) } as unknown as Response);
    });
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByRole('textbox', { name: /reviewer full name/i })).toBeInTheDocument();
  });

  it('submitting review POSTs to /api/vpats/vpat-1/review', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) } as unknown as Response);
      if (url.includes('/review')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpatAllResolved, status: 'reviewed', reviewed_by: 'Jane Smith', reviewed_at: new Date().toISOString() } }) } as unknown as Response);
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockVpatAllResolved }) } as unknown as Response);
    });
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /mark as reviewed/i }));
    await waitFor(() => screen.getByRole('textbox', { name: /reviewer full name/i }));
    await user.type(screen.getByRole('textbox', { name: /reviewer full name/i }), 'Jane Smith');
    await user.click(screen.getByRole('button', { name: /submit review/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vpats/vpat-1/review',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});

describe('VpatDetailPage Unpublish flow', () => {
  it('shows "Unpublish" in settings menu when published', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) } as unknown as Response);
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpat, status: 'published' } }) } as unknown as Response);
    });
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    expect(screen.getByRole('menuitem', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('confirming Unpublish POSTs to /api/vpats/vpat-1/unpublish and stays on page', async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/versions')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) } as unknown as Response);
      if (url.includes('/unpublish')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpat, status: 'draft' } }) } as unknown as Response);
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { ...mockVpat, status: 'published' } }) } as unknown as Response);
    });
    const user = userEvent.setup();
    render(<VpatDetailPage />);
    await waitFor(() => screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('button', { name: /vpat settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /unpublish/i }));
    await waitFor(() => screen.getByRole('alertdialog'));
    await user.click(screen.getByRole('button', { name: /^unpublish$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vpats/vpat-1/unpublish',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockPush).not.toHaveBeenCalledWith('/vpats/vpat-1/edit');
    });
  });
});
