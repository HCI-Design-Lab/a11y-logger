// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { updateCriterionRow, getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';

let vpatId: string;

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
});

describe('POST /api/vpats/[id]/rows/generate-all', () => {
  it('returns 422 when no AI provider configured', async () => {
    const origProvider = process.env.AI_PROVIDER;
    const origKey = process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('NO_AI_PROVIDER');

    process.env.AI_PROVIDER = origProvider;
    process.env.AI_API_KEY = origKey;
  });

  it('returns 404 for unknown VPAT', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'test-key';
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: 'unknown-vpat-id' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
  });

  it('skips rows that already have remarks and counts them correctly', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'test-key';

    // Pre-fill the first row with remarks
    const rows = getCriterionRows(vpatId);
    updateCriterionRow(rows[0].id, { remarks: 'Already filled.' });

    // Mock AI to succeed
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reasoning: 'Test',
                remarks: 'Generated remark.',
                confidence: 'medium',
              }),
            },
          },
        ],
      }),
    } as unknown as Response);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.skipped).toBe(1); // 1 row was skipped (had remarks)
    expect(body.data.generated).toBe(rows.length - 1); // rest were generated
    expect(body.data.errors).toHaveLength(0);

    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
  });
});
