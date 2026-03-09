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

const validUserImpact = {
  screen_reader: 'Screen reader impact text',
  low_vision: 'Low vision impact text',
  color_vision: 'Color vision impact text',
  keyboard_only: 'Keyboard only impact text',
  cognitive: 'Cognitive impact text',
  deaf_hard_of_hearing: 'Deaf/hard of hearing impact text',
};

describe('POST /api/ai/report/user-impact', () => {
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

  it('returns parsed user impact data', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue(JSON.stringify(validUserImpact)),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.screen_reader).toBe('Screen reader impact text');
    expect(json.data.low_vision).toBe('Low vision impact text');
    expect(json.data.color_vision).toBe('Color vision impact text');
    expect(json.data.keyboard_only).toBe('Keyboard only impact text');
    expect(json.data.cognitive).toBe('Cognitive impact text');
    expect(json.data.deaf_hard_of_hearing).toBe('Deaf/hard of hearing impact text');
  });

  it('returns empty strings on JSON parse failure (fallback)', async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateReportSection: vi.fn().mockResolvedValue('not valid json'),
    } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.screen_reader).toBe('');
    expect(json.data.low_vision).toBe('');
    expect(json.data.color_vision).toBe('');
    expect(json.data.keyboard_only).toBe('');
    expect(json.data.cognitive).toBe('');
    expect(json.data.deaf_hard_of_hearing).toBe('');
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
    const json = await res.json();
    expect(json.code).toBe('AI_ERROR');
  });
});
