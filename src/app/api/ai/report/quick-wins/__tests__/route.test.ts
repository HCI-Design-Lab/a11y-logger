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
import { createIssue } from '@/lib/db/issues';
import { getAIProvider } from '@/lib/ai';

let reportId: string;
let assessmentId: string;

beforeAll(() => initDb(':memory:'));
afterAll(() => closeDb());
beforeEach(async () => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'P' });
  const assessment = await createAssessment(project.id, { name: 'A' });
  assessmentId = assessment.id;
  const report = await createReport({ title: 'R', assessment_ids: [assessment.id] });
  reportId = report.id;
});

describe('POST /api/ai/report/quick-wins', () => {
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
      generateReportSection: vi.fn().mockResolvedValue('Win A\nWin B\nWin C'),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual(['Win A', 'Win B', 'Win C']);
  });

  it('strips section title if returned as first item', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue('Quick Wins\nWin A\nWin B'),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.data.items).toEqual(['Win A', 'Win B']);
  });

  it('limits items to 5', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue('W1\nW2\nW3\nW4\nW5\nW6\nW7'),
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

  it('returns 500 when AI throws', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockRejectedValue(new Error('AI failed')),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('includes issues with and without WCAG codes in AI prompt context', async () => {
    // Issue with WCAG codes — exercises the wcag_codes branch in _shared.ts
    await createIssue(assessmentId, {
      title: 'Missing alt text',
      severity: 'critical',
      wcag_codes: ['1.1.1'],
    });
    // Issue without WCAG codes — exercises the empty wcag_codes branch
    await createIssue(assessmentId, {
      title: 'Low contrast',
      severity: 'high',
      wcag_codes: [],
    });
    const generateReportSection = vi.fn().mockResolvedValue('Fix A');
    vi.mocked(getAIProvider).mockReturnValue({ generateReportSection } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    // WCAG codes should appear in the prompt context
    const callArg = generateReportSection.mock.calls[0]![0] as string;
    expect(callArg).toContain('WCAG: 1.1.1');
    expect(callArg).toContain('Low contrast');
  });
});
