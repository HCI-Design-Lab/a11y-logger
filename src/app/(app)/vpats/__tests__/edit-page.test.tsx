import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      last_generated_at: null,
      updated_at: '2026-01-01',
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
      last_generated_at: null,
      updated_at: '2026-01-01',
    },
  ],
};

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: mockVpat }),
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VpatDetailPage', () => {
  it('shows VPAT title after loading', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test VPAT')).toBeInTheDocument();
    });
  });

  it('shows progress indicator "1 of 2 criteria resolved"', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 of 2 criteria resolved/i)).toBeInTheDocument();
    });
  });

  it('shows edition badge', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/WCAG 2.1/i)).toBeInTheDocument();
    });
  });

  it('shows Publish button disabled when unresolved rows exist', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      const publishBtn = screen.getByRole('button', { name: /publish/i });
      expect(publishBtn).toBeDisabled();
    });
  });

  it('shows criteria table', async () => {
    render(<VpatDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('1.1.1')).toBeInTheDocument();
    });
  });
});
