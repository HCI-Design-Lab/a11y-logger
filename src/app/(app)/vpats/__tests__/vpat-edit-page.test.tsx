import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VpatEditPage from '../[id]/edit/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'vpat-1' }),
}));

const mockVpatReviewed = {
  id: 'vpat-1',
  title: 'Test VPAT',
  status: 'reviewed',
  standard_edition: 'WCAG',
  wcag_version: '2.1',
  wcag_level: 'AA',
  product_scope: ['web'],
  project_id: 'proj-1',
  version_number: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  published_at: null,
  reviewed_by: 'Jane Smith',
  reviewed_at: '2026-03-29T00:00:00.000Z',
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
      conformance: 'supports',
      remarks: 'All images have alt text.',
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
    if (url.includes('/api/issues/by-criterion') || url.includes('/versions')) {
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

describe('VpatEditPage', () => {
  it('shows VPAT title after loading', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test VPAT' })).toBeInTheDocument();
    });
  });

  it('shows "Edit VPAT" in breadcrumbs', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit VPAT')).toBeInTheDocument();
    });
  });

  it('shows Cancel button linking back to detail page', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      const cancelLink = screen.getByRole('link', { name: /cancel/i });
      expect(cancelLink).toHaveAttribute('href', '/vpats/vpat-1');
    });
  });

  it('shows progress indicator "1 of 2 criteria resolved"', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 of 2 criteria resolved/i)).toBeInTheDocument();
    });
  });

  it('opens issues panel when criterion name is clicked', async () => {
    const user = userEvent.setup();
    render(<VpatEditPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view issues for 1\.1\.1/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /view issues for 1\.1\.1/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /issues for criterion 1\.1\.1/i })
      ).toBeInTheDocument();
    });
  });

  it('does not show a Review button', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test VPAT' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /^review$/i })).not.toBeInTheDocument();
  });

  it('Edit-warning modal shows on page load when VPAT status is reviewed', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/issues/by-criterion') || url.includes('/versions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: mockVpatReviewed }),
      } as unknown as Response);
    });

    render(<VpatEditPage />);
    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /this vpat has been reviewed/i })
      ).toBeInTheDocument();
    });
  });

  it('Edit-warning modal does NOT show on page load when VPAT status is draft', async () => {
    render(<VpatEditPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test VPAT' })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('dialog', { name: /this vpat has been reviewed/i })
    ).not.toBeInTheDocument();
  });
});
