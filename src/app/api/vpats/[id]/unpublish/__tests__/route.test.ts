// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { POST } from '../route';

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn().mockReturnValue(null),
  setSetting: vi.fn(),
  getSettings: vi.fn().mockReturnValue({}),
  deleteSetting: vi.fn(),
  seedDefaultSettings: vi.fn(),
}));

let vpatId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const p = await createProject({ name: 'Test' });
  const v = await createVpat({
    title: 'Test',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web'],
  });
  vpatId = v.id;
});

describe('POST /api/vpats/[id]/unpublish', () => {
  it('returns 404 for unknown VPAT', async () => {
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: 'unknown' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 422 when VPAT is not published', async () => {
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('NOT_PUBLISHED');
  });

  it('returns draft VPAT when successfully unpublished', async () => {
    getDb().prepare(`UPDATE vpats SET status = 'published' WHERE id = ?`).run(vpatId);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('draft');
  });
});
