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
    const req = new Request('http://localhost/api/dashboard/pour-radar');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ perceivable: 10, operable: 8, understandable: 5, robust: 3 });
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(getPourTotals).mockRejectedValue(new Error('db error'));
    const req = new Request('http://localhost/api/dashboard/pour-radar');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('passes statuses param to getPourTotals', async () => {
    vi.mocked(getPourTotals).mockResolvedValue({
      perceivable: 3,
      operable: 2,
      understandable: 1,
      robust: 0,
    });
    const req = new Request('http://localhost/api/dashboard/pour-radar?statuses=open,resolved');
    await GET(req);
    expect(getPourTotals).toHaveBeenCalledWith(['open', 'resolved']);
  });
});
