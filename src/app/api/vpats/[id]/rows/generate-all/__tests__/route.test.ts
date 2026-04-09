// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { updateCriterionRow, getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';
import { getAIProvider } from '@/lib/ai';
import { getSetting } from '@/lib/db/settings';

const mockGetSetting = vi.mocked(getSetting);

vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

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
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/vpats/[id]/rows/generate-all', () => {
  it('returns 422 when no AI provider configured', async () => {
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('NO_AI_PROVIDER');
  });

  it('returns 404 for unknown VPAT', async () => {
    vi.mocked(getAIProvider).mockReturnValue({ generateVpatRow: vi.fn() } as never);
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: 'unknown-vpat-id' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('skips rows that already have remarks and counts them correctly', async () => {
    const rows = await getCriterionRows(vpatId);
    await updateCriterionRow(rows[0]!.id, { remarks: 'Already filled.' });

    vi.mocked(getAIProvider).mockReturnValue({
      generateVpatRow: vi.fn().mockResolvedValue({
        reasoning: 'Test',
        remarks: 'Generated remark.',
        confidence: 'medium',
        referenced_issues: [],
        suggested_conformance: 'supports',
      }),
    } as never);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.skipped).toBe(1); // 1 row was skipped (had remarks)
    expect(body.data.generated).toBe(rows.length - 1); // rest were generated
    expect(body.data.errors).toHaveLength(0);
  });

  it('accumulates errors for failed AI calls and counts correctly', async () => {
    const rows = await getCriterionRows(vpatId);
    let callCount = 0;
    vi.mocked(getAIProvider).mockReturnValue({
      generateVpatRow: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('Network error');
        return {
          reasoning: 'r',
          remarks: 'Generated.',
          confidence: 'medium',
          referenced_issues: [],
          suggested_conformance: 'supports',
        };
      }),
    } as never);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.errors).toHaveLength(1);
    expect(body.data.generated).toBe(rows.length - 1);
    expect(body.data.skipped).toBe(0);
  });
});

describe('POST generate-all — AI Review Pass', () => {
  const firstPassResult = {
    remarks: 'First pass.',
    confidence: 'medium' as const,
    reasoning: 'OK.',
    referenced_issues: [],
    suggested_conformance: 'supports' as const,
  };
  const reviewedResult = {
    remarks: 'Reviewed.',
    confidence: 'high' as const,
    reasoning: 'OK.',
    referenced_issues: [],
    suggested_conformance: 'supports' as const,
  };

  it('calls reviewVpatRow for each row when review pass is enabled and provider is available', async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === 'ai_review_pass_enabled') return true;
      return null;
    });
    const reviewVpatRow = vi.fn().mockResolvedValue(reviewedResult);
    vi.mocked(getAIProvider)
      .mockReturnValueOnce({ generateVpatRow: vi.fn().mockResolvedValue(firstPassResult) } as never)
      .mockReturnValueOnce({ reviewVpatRow } as never);

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: vpatId }) });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(reviewVpatRow).toHaveBeenCalled();
  });

  it('skips review pass when review provider is null', async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === 'ai_review_pass_enabled') return true;
      return null;
    });
    vi.mocked(getAIProvider)
      .mockReturnValueOnce({ generateVpatRow: vi.fn().mockResolvedValue(firstPassResult) } as never)
      .mockReturnValueOnce(null);

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: vpatId }) });
    const json = await res.json();

    expect(json.success).toBe(true);
  });
});
