// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';

let assessmentId: string;

beforeAll(() => initDb(':memory:'));
afterAll(() => closeDb());
beforeEach(async () => {
  getDb().prepare('DELETE FROM report_assessments').run();
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  const assessment = await createAssessment(project.id, { name: 'Assessment 1' });
  assessmentId = assessment.id;
});

describe('POST /api/reports', () => {
  it('creates a report with assessment_ids', async () => {
    const req = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Report', assessment_ids: [assessmentId] }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.assessment_ids).toContain(assessmentId);
  });

  it('returns 400 when assessment_ids is missing', async () => {
    const req = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Report' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const req = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment_ids: [assessmentId] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when assessment does not exist', async () => {
    const req = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'R', assessment_ids: ['nonexistent-id'] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/reports', () => {
  it('returns empty array when no reports', async () => {
    const req = new Request('http://localhost/api/reports');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('returns all reports', async () => {
    await POST(
      new Request('http://localhost/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Report A', assessment_ids: [assessmentId] }),
      })
    );
    const req = new Request('http://localhost/api/reports');
    const res = await GET(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].assessment_ids).toContain(assessmentId);
  });
});
