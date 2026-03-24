import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/dashboard', () => ({
  getPourTotals: vi.fn(),
}));
import { getPourTotals } from '@/lib/db/dashboard';

describe('GET /api/dashboard/pour-radar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with pour totals', async () => {
    vi.mocked(getPourTotals).mockResolvedValue({
      perceivable: 10,
      operable: 8,
      understandable: 5,
      robust: 3,
    });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ perceivable: 10, operable: 8, understandable: 5, robust: 3 });
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(getPourTotals).mockRejectedValue(new Error('db error'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
