// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';
import { GET, POST } from '../route';

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

describe('GET /api/projects/[projectId]/assessments/[assessmentId]/issues', () => {
  it('returns empty array when no issues exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`),
      makeContext(projectId, assessmentId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns issues for the assessment', async () => {
    await createIssue(assessmentId, { title: 'Bug One' });
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Bug One');
  });

  it('does not return issues from other assessments', async () => {
    const other = await createAssessment(projectId, { name: 'Other Audit' });
    await createIssue(other.id, { title: 'Not Mine' });
    await createIssue(assessmentId, { title: 'Mine' });
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Mine');
  });

  it('filters by severity query param', async () => {
    await createIssue(assessmentId, { title: 'Critical', severity: 'critical' });
    await createIssue(assessmentId, { title: 'Low', severity: 'low' });
    const response = await GET(
      new Request(
        `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues?severity=critical`
      ),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Critical');
  });

  it('filters by status query param', async () => {
    await createIssue(assessmentId, { title: 'Open', status: 'open' });
    await createIssue(assessmentId, { title: 'Wont Fix', status: 'wont_fix' });
    const response = await GET(
      new Request(
        `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues?status=wont_fix`
      ),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Wont Fix');
  });

  it('filters by wcag_code query param', async () => {
    await createIssue(assessmentId, { title: 'Has Code', wcag_codes: ['1.1.1'] });
    await createIssue(assessmentId, { title: 'Other Code', wcag_codes: ['2.1.1'] });
    const response = await GET(
      new Request(
        `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues?wcag_code=1.1.1`
      ),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Has Code');
  });

  it('filters by tag query param', async () => {
    await createIssue(assessmentId, { title: 'Tagged', tags: ['navigation'] });
    await createIssue(assessmentId, { title: 'Other Tag', tags: ['forms'] });
    const response = await GET(
      new Request(
        `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues?tag=navigation`
      ),
      makeContext(projectId, assessmentId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Tagged');
  });

  it('returns 404 when project does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/no-proj/assessments/${assessmentId}/issues`),
      makeContext('no-proj', assessmentId)
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/no-assessment/issues`),
      makeContext(projectId, 'no-assessment')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment belongs to a different project', async () => {
    const otherProject = await createProject({ name: 'Other' });
    const response = await GET(
      new Request(
        `http://localhost/api/projects/${otherProject.id}/assessments/${assessmentId}/issues`
      ),
      makeContext(otherProject.id, assessmentId)
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/projects/[projectId]/assessments/[assessmentId]/issues', () => {
  it('creates an issue and returns 201', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Issue', severity: 'high' }),
      }
    );
    const response = await POST(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Issue');
    expect(body.data.id).toBeDefined();
    expect(body.data.assessment_id).toBe(assessmentId);
  });

  it('returns JSON array fields as arrays', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', wcag_codes: ['1.1.1'], tags: ['nav'] }),
      }
    );
    const response = await POST(request, makeContext(projectId, assessmentId));
    const body = await response.json();
    expect(body.data.wcag_codes).toEqual(['1.1.1']);
    expect(body.data.tags).toEqual(['nav']);
  });

  it('returns 400 for missing title', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }
    );
    const response = await POST(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid severity', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', severity: 'blocker' }),
      }
    );
    const response = await POST(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for unknown WCAG code', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', wcag_codes: ['9.9.9'] }),
      }
    );
    const response = await POST(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request(
      `http://localhost/api/projects/no-proj/assessments/${assessmentId}/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T' }),
      }
    );
    const response = await POST(request, makeContext('no-proj', assessmentId));
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment does not exist', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/no-assessment/issues`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T' }),
      }
    );
    const response = await POST(request, makeContext(projectId, 'no-assessment'));
    expect(response.status).toBe(404);
  });
});
