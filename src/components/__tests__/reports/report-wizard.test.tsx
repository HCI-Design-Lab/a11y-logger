import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ReportWizard } from '@/components/reports/report-wizard';

const mockProjects = [{ id: 'p1', name: 'Project Alpha' }];
const mockAssessments = [{ id: 'a1', project_id: 'p1', name: 'Assessment 1', status: 'completed' }];

describe('ReportWizard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders step 1 with a project multi-select', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it('disables Next on step 1 when no project selected', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('enables Next when a project is selected', async () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('advances to step 2 showing assessments', async () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('advances to step 3 after selecting assessment', async () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Assessment 1/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/report title/i)).toBeInTheDocument();
  });

  it('Back button returns to previous step', async () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it('filters assessments by selected projects', async () => {
    const multiProjects = [
      { id: 'p1', name: 'Project Alpha' },
      { id: 'p2', name: 'Project Beta' },
    ];
    const multiAssessments = [
      { id: 'a1', project_id: 'p1', name: 'Alpha Assessment', status: 'completed' },
      { id: 'a2', project_id: 'p2', name: 'Beta Assessment', status: 'completed' },
    ];
    render(<ReportWizard projects={multiProjects} assessments={multiAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Alpha Assessment/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Beta Assessment/ })).not.toBeInTheDocument();
  });

  it('disables Create Report when title is empty', async () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Assessment 1/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: /create report/i })).toBeDisabled();
  });

  it('shows error when API returns failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Validation failed' }),
    } as Response);

    const { toast } = await import('sonner');
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Assessment 1/ }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.change(screen.getByPlaceholderText(/report title/i), {
      target: { value: 'My Report' },
    });
    await userEvent.click(screen.getByRole('button', { name: /create report/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });
  });
});
