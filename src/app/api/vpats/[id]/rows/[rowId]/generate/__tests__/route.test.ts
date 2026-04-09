// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { POST } from '../route';
import { getAIProvider } from '@/lib/ai';
import { getSetting } from '@/lib/db/settings';

const mockGetAIProvider = vi.mocked(getAIProvider);
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
    mockGetAIProvider.mockReturnValue({ generateVpatRow: vi.fn() } as never);
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId: 'unknown-row-id' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown VPAT', async () => {
    mockGetAIProvider.mockReturnValue({ generateVpatRow: vi.fn() } as never);
    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: 'unknown-vpat-id', rowId }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when row belongs to different VPAT', async () => {
    mockGetAIProvider.mockReturnValue({ generateVpatRow: vi.fn() } as never);
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
    const firstPassResult = {
      remarks: 'The product supports this criterion.',
      confidence: 'high' as const,
      reasoning: 'No issues found.',
      referenced_issues: [],
      suggested_conformance: 'supports' as const,
    };
    mockGetAIProvider.mockReturnValue({
      generateVpatRow: vi.fn().mockResolvedValue(firstPassResult),
    } as never);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.remarks).toBe('The product supports this criterion.');
    expect(body.data.ai_confidence).toBe('high');
    expect(body.data.ai_reasoning).toBe('No issues found.');
    expect(body.data.ai_referenced_issues).toEqual([]);
    expect(body.data.ai_suggested_conformance).toBe('supports');
  });

  it('stores referenced issues as snapshot', async () => {
    const firstPassResult = {
      remarks: 'Does not support.',
      confidence: 'high' as const,
      reasoning: 'One issue found.',
      referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
      suggested_conformance: 'does_not_support' as const,
    };
    mockGetAIProvider.mockReturnValue({
      generateVpatRow: vi.fn().mockResolvedValue(firstPassResult),
    } as never);

    const res = await POST(new Request('http://localhost/', { method: 'POST' }), {
      params: Promise.resolve({ id: vpatId, rowId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.ai_referenced_issues).toEqual([{ title: 'Missing alt', severity: 'high' }]);
    expect(body.data.ai_suggested_conformance).toBe('does_not_support');
  });
});

describe('POST generate — AI Review Pass', () => {
  const firstPassResult = {
    remarks: 'Does not support.',
    confidence: 'medium' as const,
    reasoning: 'One issue.',
    referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
    suggested_conformance: 'does_not_support' as const,
  };
  const reviewedResult = {
    remarks: 'Does not support 1.1.1.',
    confidence: 'high' as const,
    reasoning: 'Reviewed: correct.',
    referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
    suggested_conformance: 'does_not_support' as const,
  };

  it('does not call reviewVpatRow when ai_review_pass_enabled is false', async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === 'ai_review_pass_enabled') return false;
      return null;
    });
    const reviewVpatRow = vi.fn();
    vi.mocked(getAIProvider).mockReturnValueOnce({
      generateVpatRow: vi.fn().mockResolvedValue(firstPassResult),
      reviewVpatRow,
    } as never);

    const req = new Request('http://localhost', { method: 'POST' });
    await POST(req, { params: Promise.resolve({ id: vpatId, rowId }) });

    expect(reviewVpatRow).not.toHaveBeenCalled();
  });

  it('calls reviewVpatRow when ai_review_pass_enabled is true and review provider is available', async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === 'ai_review_pass_enabled') return true;
      return null;
    });
    const reviewVpatRow = vi.fn().mockResolvedValue(reviewedResult);
    vi.mocked(getAIProvider)
      .mockReturnValueOnce({ generateVpatRow: vi.fn().mockResolvedValue(firstPassResult) } as never)
      .mockReturnValueOnce({ reviewVpatRow } as never);

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: vpatId, rowId }) });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(reviewVpatRow).toHaveBeenCalledWith(
      expect.objectContaining({ criterion: expect.any(Object) }),
      firstPassResult
    );
  });

  it('uses first-pass result when review provider is null', async () => {
    mockGetSetting.mockImplementation((key: string) => {
      if (key === 'ai_review_pass_enabled') return true;
      return null;
    });
    vi.mocked(getAIProvider)
      .mockReturnValueOnce({ generateVpatRow: vi.fn().mockResolvedValue(firstPassResult) } as never)
      .mockReturnValueOnce(null);

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: vpatId, rowId }) });
    const json = await res.json();

    expect(json.success).toBe(true);
  });
});
