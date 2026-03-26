import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportIssuesModal } from '../import-issues-modal';

// Mock papaparse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((file, opts) => {
      opts.complete({
        data: [
          { title: 'Issue 1', description: 'Desc 1' },
          { title: 'Issue 2', description: 'Desc 2' },
        ],
        meta: { fields: ['title', 'description'] },
      });
    }),
  },
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: { imported: 2, warnings: [] } }),
});

const defaultProps = {
  projectId: 'proj-1',
  assessmentId: 'assess-1',
  onImportComplete: vi.fn(),
};

describe('ImportIssuesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a trigger button', () => {
    render(<ImportIssuesModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('opens the modal when trigger is clicked', async () => {
    render(<ImportIssuesModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(screen.getByText(/upload csv/i)).toBeInTheDocument();
  });

  it('shows column mapping after file upload', async () => {
    render(<ImportIssuesModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));

    const file = new File(['title,description\nIssue 1,Desc 1'], 'issues.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/csv file/i);
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/map columns/i)).toBeInTheDocument();
    // "Title" label appears and auto-mapping selects "title" CSV column — both contain /title/i
    expect(screen.getAllByText(/title/i).length).toBeGreaterThanOrEqual(1);

    // Auto-mapping should have selected the "title" CSV column for the Title field
    const combos = screen.getAllByRole('combobox');
    const titleCombo = combos.find((c) => c.textContent?.toLowerCase().includes('title'));
    expect(titleCombo).toBeDefined();
  });

  it('calls onImportComplete after successful import', async () => {
    render(<ImportIssuesModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));

    const file = new File(['title,description\nIssue 1,Desc 1'], 'issues.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/csv file/i);
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /import 2 rows/i }));

    await waitFor(() => {
      expect(defaultProps.onImportComplete).toHaveBeenCalled();
    });
  });

  it('does not render trigger button when open prop is provided (controlled mode)', () => {
    render(
      <ImportIssuesModal
        projectId="p1"
        assessmentId="a1"
        onImportComplete={vi.fn()}
        open={false}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
  });

  it('dialog is open when controlled open=true', () => {
    render(
      <ImportIssuesModal
        projectId="p1"
        assessmentId="a1"
        onImportComplete={vi.fn()}
        open={true}
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders trigger button in uncontrolled mode (no open prop)', () => {
    render(<ImportIssuesModal projectId="p1" assessmentId="a1" onImportComplete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('shows error message when import fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Import failed', code: 'INTERNAL_ERROR' }),
    } as Response);

    render(<ImportIssuesModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));

    const file = new File(['title\nIssue 1'], 'issues.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/csv file/i);
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /import 2 rows/i }));

    await waitFor(() => {
      expect(screen.getByText(/import failed/i)).toBeInTheDocument();
    });
    expect(defaultProps.onImportComplete).not.toHaveBeenCalled();
  });
});
