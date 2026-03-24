import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/dashboard', () => ({
  getEnvironmentBreakdown: vi.fn(),
}));
import { getEnvironmentBreakdown } from '@/lib/db/dashboard';

describe('GET /api/dashboard/environment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with environment breakdown', async () => {
    const mockData = [
      { environment: 'web', count: 20 },
      { environment: 'mobile', count: 7 },
      { environment: 'native', count: 3 },
    ];
    vi.mocked(getEnvironmentBreakdown).mockResolvedValue(mockData);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockData);
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(getEnvironmentBreakdown).mockRejectedValue(new Error('db error'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
