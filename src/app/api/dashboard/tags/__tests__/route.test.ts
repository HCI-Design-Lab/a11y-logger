import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/dashboard', () => ({
  getTagFrequency: vi.fn(),
}));
import { getTagFrequency } from '@/lib/db/dashboard';

describe('GET /api/dashboard/tags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with tag frequency', async () => {
    const mockData = [
      { tag: 'images', count: 15 },
      { tag: 'forms', count: 11 },
      { tag: 'navigation', count: 6 },
    ];
    vi.mocked(getTagFrequency).mockResolvedValue(mockData);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockData);
  });

  it('returns 500 on DB error', async () => {
    vi.mocked(getTagFrequency).mockRejectedValue(new Error('db error'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
