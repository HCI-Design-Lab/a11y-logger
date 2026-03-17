// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';

let vpatId: string;
let rowId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(() => {
  vi.resetAllMocks();
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM projects').run();
  const p = createProject({ name: 'Test' });
  const v = createVpat({
    title: 'Test',
    project_id: p.id,
    standard_edition: 'WCAG',
    product_scope: ['web'],
  });
  vpatId = v.id;
  rowId = getCriterionRows(vpatId)[0].id;
});

describe('POST /api/vpats/[id]/rows/[rowId]/generate', () => {
  it('returns 422 when no AI provider configured', async () => {
    // Ensure no AI env vars set
    const origProvider = process.env.AI_PROVIDER;
    const origKey = process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('NO_AI_PROVIDER');

    process.env.AI_PROVIDER = origProvider;
    process.env.AI_API_KEY = origKey;
  });

  it('returns 404 for unknown row', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'test-key';
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId: 'unknown-row-id' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
  });
});
