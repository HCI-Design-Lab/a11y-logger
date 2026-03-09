// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET } from '../route';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createReport } from '@/lib/db/reports';

let reportId: string;
let assessmentId: string;

beforeAll(() => initDb(':memory:'));
afterAll(() => closeDb());
beforeEach(() => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'P' });
  const assessment = createAssessment(project.id, { name: 'A' });
  assessmentId = assessment.id;
  const report = createReport({ title: 'R', assessment_ids: [assessmentId] });
  reportId = report.id;
});

describe('GET /api/reports/[id]/issues', () => {
  it('returns empty array when no issues', async () => {
    const res = await GET({} as Request, { params: Promise.resolve({ id: reportId }) });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('returns issues from linked assessments', async () => {
    getDb()
      .prepare(
        `INSERT INTO issues (id, assessment_id, title, severity) VALUES ('i1', ?, 'Issue A', 'high')`
      )
      .run(assessmentId);
    const res = await GET({} as Request, { params: Promise.resolve({ id: reportId }) });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe('Issue A');
  });

  it('returns 404 for unknown report', async () => {
    const res = await GET({} as Request, { params: Promise.resolve({ id: 'nope' }) });
    expect(res.status).toBe(404);
  });
});
