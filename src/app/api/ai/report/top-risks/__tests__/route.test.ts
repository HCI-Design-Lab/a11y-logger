// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(),
}));

import { POST } from '../route';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createReport } from '@/lib/db/reports';
import { getAIProvider } from '@/lib/ai';

let reportId: string;

beforeAll(() => initDb(':memory:'));
afterAll(() => closeDb());
beforeEach(() => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'P' });
  const assessment = createAssessment(project.id, { name: 'A' });
  const report = createReport({ title: 'R', assessment_ids: [assessment.id] });
  reportId = report.id;
});

describe('POST /api/ai/report/top-risks', () => {
  it('returns 503 when AI not configured', async () => {
    vi.mocked(getAIProvider).mockReturnValue(null);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns parsed list of items', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue('Risk A\nRisk B\nRisk C'),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual(['Risk A', 'Risk B', 'Risk C']);
  });

  it('limits items to 5', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue('R1\nR2\nR3\nR4\nR5\nR6\nR7'),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.data.items).toHaveLength(5);
  });

  it('returns 404 for unknown report', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn(),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: 'nope' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when reportId is missing', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn(),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('VALIDATION_ERROR');
  });
});
