// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';
import { POST } from '../route';

let projectId: string;
let assessmentId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
  const assessment = await createAssessment(projectId, { name: 'Baseline Audit' });
  assessmentId = assessment.id;
});

function makeContext(pid: string, aid: string) {
  return { params: Promise.resolve({ projectId: pid, assessmentId: aid }) };
}

function makeRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /issues/import', () => {
  it('imports rows and returns count', async () => {
    const res = await POST(
      makeRequest({
        rows: [
          { title: 'Missing alt text', sev: 'critical' },
          { title: 'Low contrast', sev: 'high' },
        ],
        mapping: { title: 'title', severity: 'sev' },
      }),
      makeContext(projectId, assessmentId)
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.imported).toBe(2);
    const issues = await getIssues(assessmentId);
    expect(issues).toHaveLength(2);
  });

  it('returns warnings for invalid enum values', async () => {
    const res = await POST(
      makeRequest({
        rows: [{ title: 'Issue', sev: 'not-a-severity' }],
        mapping: { title: 'title', severity: 'sev' },
      }),
      makeContext(projectId, assessmentId)
    );
    const body = await res.json();
    expect(body.data.warnings.length).toBeGreaterThan(0);
    expect(body.data.warnings[0]).toMatch(/severity/);
  });

  it('imports rows even when title is not mapped, using "Untitled"', async () => {
    const res = await POST(
      makeRequest({
        rows: [{ desc: 'No title' }],
        mapping: { description: 'desc' },
      }),
      makeContext(projectId, assessmentId)
    );
    const body = await res.json();
    expect(body.data.imported).toBe(1);
    const issues = await getIssues(assessmentId);
    expect(issues[0].title).toBe('Untitled');
  });

  it('returns 400 for missing rows or mapping', async () => {
    const res = await POST(makeRequest({}), makeContext(projectId, assessmentId));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown assessment', async () => {
    const res = await POST(
      makeRequest({ rows: [], mapping: {} }),
      makeContext(projectId, 'nonexistent-id')
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown project', async () => {
    const res = await POST(
      makeRequest({ rows: [], mapping: {} }),
      makeContext('nonexistent-project', assessmentId)
    );
    expect(res.status).toBe(404);
  });
});
