import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/dashboard', () => ({
  getRepeatOffenders: vi.fn(),
}));
import { getRepeatOffenders } from '@/lib/db/dashboard';

describe('GET /api/dashboard/repeat-offenders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with repeat offenders', async () => {
    const mockData = [
      { title: 'Missing alt text', count: 12 },
      { title: 'Low contrast', count: 8 },
    ];
    vi.mocked(getRepeatOffenders).mockResolvedValue(mockData);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockData);
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(getRepeatOffenders).mockRejectedValue(new Error('db error'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
