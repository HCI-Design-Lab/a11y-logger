// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn().mockReturnValue(null),
  setSetting: vi.fn(),
  getSettings: vi.fn().mockReturnValue({}),
  deleteSetting: vi.fn(),
  seedDefaultSettings: vi.fn(),
}));

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>();
  return { ...original, generateText: vi.fn() };
});

let vpatId: string;
let rowId: string;

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  vi.resetAllMocks();
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
  const rows = await getCriterionRows(vpatId);
  rowId = rows[0]!.id;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/vpats/[id]/rows/[rowId]/generate', () => {
  it('returns 422 when no AI provider configured', async () => {
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('NO_AI_PROVIDER');
  });

  it('returns 404 for unknown row', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_API_KEY', 'test-key');
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId: 'unknown-row-id' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown VPAT', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_API_KEY', 'test-key');
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: 'unknown-vpat-id', rowId }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when row belongs to different VPAT', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_API_KEY', 'test-key');
    const otherProject = await createProject({ name: 'Other' });
    const otherVpat = await createVpat({
      title: 'Other',
      project_id: otherProject.id,
    });
    const otherRows = await getCriterionRows(otherVpat.id);
    const otherRowId = otherRows[0]!.id;
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId: otherRowId }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns updated row after successful generation', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_API_KEY', 'test-key');

    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        reasoning: 'No issues found.',
        remarks: 'The product supports this criterion.',
        confidence: 'high',
      }),
    } as Awaited<ReturnType<typeof generateText>>);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.remarks).toBe('The product supports this criterion.');
    expect(body.data.ai_confidence).toBe('high');
    expect(body.data.ai_reasoning).toBe('No issues found.');
  });
});
