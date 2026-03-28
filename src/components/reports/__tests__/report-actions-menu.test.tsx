import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock sonner
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ReportActionsMenu } from '../report-actions-menu';

const defaultProps = {
  reportId: 'report-1',
  reportTitle: 'Test Report',
  isPublished: false,
};

describe('ReportActionsMenu', () => {
  it('renders a settings trigger button', () => {
    render(<ReportActionsMenu {...defaultProps} />);
    expect(screen.getByRole('button', { name: /report actions/i })).toBeInTheDocument();
  });

  it('shows Edit option when draft', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
  });

  it('hides Edit option when published', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('shows Publish option when draft', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /publish/i })).toBeInTheDocument();
  });

  it('shows Unpublish option when published', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={true} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /unpublish/i })).toBeInTheDocument();
  });

  it('shows Delete option', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/delete report/i)).toBeInTheDocument();
  });

  it('opens publish confirmation dialog when Publish is clicked', async () => {
    render(<ReportActionsMenu {...defaultProps} isPublished={false} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /publish/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/publish report/i)).toBeInTheDocument();
  });

  it('renders export links in the dropdown', async () => {
    render(<ReportActionsMenu {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /report actions/i }));
    expect(screen.getByRole('menuitem', { name: /html.*default/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /word/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /print/i })).toBeInTheDocument();
  });
});
