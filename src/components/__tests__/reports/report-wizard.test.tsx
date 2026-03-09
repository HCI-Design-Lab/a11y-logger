import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

import { ReportWizard } from '@/components/reports/report-wizard';

const mockProjects = [{ id: 'p1', name: 'Project Alpha' }];
const mockAssessments = [{ id: 'a1', project_id: 'p1', name: 'Assessment 1', status: 'completed' }];

describe('ReportWizard', () => {
  it('renders step 1 with project list', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it('disables Next on step 1 when no project selected', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('enables Next when a project is selected', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    fireEvent.click(screen.getByText('Project Alpha'));
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('advances to step 2 showing assessments', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    fireEvent.click(screen.getByText('Project Alpha'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Assessment 1')).toBeInTheDocument();
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('advances to step 3 after selecting assessment', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    fireEvent.click(screen.getByText('Project Alpha'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText('Assessment 1'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/report title/i)).toBeInTheDocument();
  });

  it('Back button returns to previous step', () => {
    render(<ReportWizard projects={mockProjects} assessments={mockAssessments} />);
    fireEvent.click(screen.getByText('Project Alpha'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });
});
