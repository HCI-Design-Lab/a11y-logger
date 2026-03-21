import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockPush, mockRefresh, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('sonner', () => ({
  toast: { error: mockToastError, success: vi.fn() },
}));

import { ReportWizard } from '../report-wizard';

const projects = [
  { id: 'p1', name: 'Project Alpha' },
  { id: 'p2', name: 'Project Beta' },
];
const assessments = [
  { id: 'a1', project_id: 'p1', name: 'Q1 Audit', status: 'ready' },
  { id: 'a2', project_id: 'p2', name: 'Q2 Audit', status: 'ready' },
];

describe('ReportWizard card styling', () => {
  it('wraps content in a card', () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });

  it('displays the step title inside a card header', () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    const cardHeader = document.querySelector('[data-slot="card-header"]')!;
    expect(cardHeader).toContainElement(screen.getByText('Select Projects'));
  });
});

describe('ReportWizard step navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('shows a project multi-select on step 1', () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('Next button is disabled until a project is selected', () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('advances to step 2 after selecting a project and clicking Next', async () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Select Assessments')).toBeInTheDocument();
  });

  it('shows only assessments for selected projects on step 2', async () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Q1 Audit/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Q2 Audit/ })).not.toBeInTheDocument();
  });

  it('advances to step 3 after selecting an assessment', async () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Q1 Audit/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Name Your Report')).toBeInTheDocument();
  });

  it('goes back to step 2 from step 3', async () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Q1 Audit/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Select Assessments')).toBeInTheDocument();
  });

  it('submits the report and navigates to the edit page on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { id: 'r1' } }),
    });
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Q1 Audit/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.type(screen.getByLabelText('Report Title'), 'My Report');
    await userEvent.click(screen.getByRole('button', { name: 'Create Report' }));
    expect(mockPush).toHaveBeenCalledWith('/reports/r1/edit');
  });

  it('Create Report button is disabled when title is empty', async () => {
    render(<ReportWizard projects={projects} assessments={assessments} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Q1 Audit/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Create Report' })).toBeDisabled();
  });
});
