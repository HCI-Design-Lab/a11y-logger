import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ReportEditForm } from '@/components/reports/report-edit-form';

const mockReport = {
  id: 'r1',
  title: 'My Report',
  status: 'draft' as const,
  content: '{}',
  type: 'detailed' as const,
  assessment_ids: ['a1'],
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('ReportEditForm', () => {
  it('renders section placeholder cards when content is empty', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    expect(screen.getByText(/add executive summary/i)).toBeInTheDocument();
    expect(screen.getByText(/add top risks/i)).toBeInTheDocument();
    expect(screen.getByText(/add quick wins/i)).toBeInTheDocument();
    expect(screen.getByText(/add user impact/i)).toBeInTheDocument();
  });

  it('expands executive summary section when + clicked', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    expect(screen.getByPlaceholderText(/executive summary/i)).toBeInTheDocument();
  });

  it('shows delete modal when trash icon clicked', async () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    fireEvent.click(screen.getByRole('button', { name: /delete section/i }));
    await waitFor(() => {
      expect(screen.getByText(/permanently remove/i)).toBeInTheDocument();
    });
  });

  it('removes section after delete confirmed', async () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    fireEvent.click(screen.getByText(/add executive summary/i));
    fireEvent.click(screen.getByRole('button', { name: /delete section/i }));
    await waitFor(() => screen.getByText(/permanently remove/i));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.getByText(/add executive summary/i)).toBeInTheDocument();
    });
  });

  it('renders Save Report button', () => {
    render(<ReportEditForm report={mockReport} issues={[]} />);
    expect(screen.getByRole('button', { name: /save report/i })).toBeInTheDocument();
  });
});
