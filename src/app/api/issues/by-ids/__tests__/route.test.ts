import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/db/issues', () => ({
  getIssuesByIds: vi.fn().mockReturnValue([
    {
      id: 'i1',
      title: 'Test Issue',
      severity: 'high',
      description: 'Some description',
      project_id: 'p1',
      assessment_id: 'a1',
      wcag_codes: '[]',
      status: 'open',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ]),
}));

describe('GET /api/issues/by-ids', () => {
  it('returns issues for given IDs', async () => {
    const req = new Request('http://localhost/api/issues/by-ids?ids=i1');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe('i1');
  });

  it('returns empty array when no ids param provided', async () => {
    // Reset mock to return empty
    const { getIssuesByIds } = await import('@/lib/db/issues');
    vi.mocked(getIssuesByIds).mockReturnValueOnce([]);

    const req = new Request('http://localhost/api/issues/by-ids');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(0);
  });
});
