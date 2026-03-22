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
    expect(screen.getByText(/title/i)).toBeInTheDocument();
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
});
