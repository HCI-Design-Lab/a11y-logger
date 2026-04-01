import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Tooltip: () => null,
}));

const mockData = {
  breakdown: { critical: 2, high: 3, medium: 1, low: 0 },
  total: 6,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IssueStatistics subtitle', () => {
  it('shows "Open" subtitle when statuses is [open]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Issue Statistics')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows "Resolved" subtitle when statuses is [resolved]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['resolved']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('shows "Won\'t Fix" subtitle when statuses is [wont_fix]', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['wont_fix']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText("Won't Fix")).toBeInTheDocument();
  });

  it('shows combined label when multiple statuses selected', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open', 'resolved']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Open · Resolved')).toBeInTheDocument();
  });
});

describe('IssueStatistics chart center label', () => {
  it('shows "Issues" in chart center', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });
    render(<IssueStatistics statuses={['open']} />);
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });
});
