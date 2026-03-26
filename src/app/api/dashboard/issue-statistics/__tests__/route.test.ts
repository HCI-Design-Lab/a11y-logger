import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/dashboard', () => ({
  getSeverityBreakdown: vi.fn(),
}));

import { getSeverityBreakdown } from '@/lib/db/dashboard';

describe('GET /api/dashboard/issue-statistics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns severity breakdown with default statuses', async () => {
    const mockData = {
      breakdown: { critical: 2, high: 5, medium: 3, low: 1 },
      total: 11,
    };
    vi.mocked(getSeverityBreakdown).mockResolvedValue(mockData);

    const req = new Request('http://localhost/api/dashboard/issue-statistics');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, data: mockData });
    expect(getSeverityBreakdown).toHaveBeenCalledWith(['open'], undefined);
  });

  it('passes statuses query param to getSeverityBreakdown', async () => {
    vi.mocked(getSeverityBreakdown).mockResolvedValue({
      breakdown: { critical: 0, high: 1, medium: 0, low: 0 },
      total: 1,
    });

    const req = new Request(
      'http://localhost/api/dashboard/issue-statistics?statuses=open,resolved'
    );
    await GET(req);

    expect(getSeverityBreakdown).toHaveBeenCalledWith(['open', 'resolved'], undefined);
  });

  it('passes projectId query param to getSeverityBreakdown', async () => {
    vi.mocked(getSeverityBreakdown).mockResolvedValue({
      breakdown: { critical: 1, high: 0, medium: 0, low: 0 },
      total: 1,
    });

    const req = new Request(
      'http://localhost/api/dashboard/issue-statistics?statuses=open&projectId=proj_123'
    );
    await GET(req);

    expect(getSeverityBreakdown).toHaveBeenCalledWith(['open'], 'proj_123');
  });

  it('returns 500 on error', async () => {
    vi.mocked(getSeverityBreakdown).mockRejectedValue(new Error('db error'));
    const req = new Request('http://localhost/api/dashboard/issue-statistics');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
