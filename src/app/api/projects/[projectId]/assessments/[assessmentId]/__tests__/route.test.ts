// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { GET, PUT, DELETE } from '../route';

let projectId: string;
let assessmentId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
  const assessment = createAssessment(projectId, { name: 'Test Audit' });
  assessmentId = assessment.id;
});

function makeContext(pid: string, id: string) {
  return { params: Promise.resolve({ projectId: pid, assessmentId: id }) };
}

describe('GET /api/projects/[projectId]/assessments/[id]', () => {
  it('returns the assessment', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/${assessmentId}`),
      makeContext(projectId, assessmentId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(assessmentId);
    expect(body.data.name).toBe('Test Audit');
  });

  it('returns 404 when project does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/no-project/assessments/${assessmentId}`),
      makeContext('no-project', assessmentId)
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment does not exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments/no-assessment`),
      makeContext(projectId, 'no-assessment')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when assessment belongs to a different project', async () => {
    const otherProject = createProject({ name: 'Other' });
    const response = await GET(
      new Request(`http://localhost/api/projects/${otherProject.id}/assessments/${assessmentId}`),
      makeContext(otherProject.id, assessmentId)
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/projects/[projectId]/assessments/[id]', () => {
  it('updates the assessment and returns it', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Audit', status: 'in_progress' }),
      }
    );
    const response = await PUT(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated Audit');
    expect(body.data.status).toBe('in_progress');
  });

  it('returns 400 for invalid update data', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      }
    );
    const response = await PUT(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when date range is invalid', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_date_start: '2024-01-20T00:00:00.000Z',
          test_date_end: '2024-01-10T00:00:00.000Z',
        }),
      }
    );
    const response = await PUT(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request(
      `http://localhost/api/projects/no-project/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'X' }),
      }
    );
    const response = await PUT(request, makeContext('no-project', assessmentId));
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment does not exist', async () => {
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/no-assessment`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'X' }),
      }
    );
    const response = await PUT(request, makeContext(projectId, 'no-assessment'));
    expect(response.status).toBe(404);
  });
  it('returns 404 when assessment belongs to a different project', async () => {
    const otherProject = createProject({ name: 'Other' });
    const request = new Request(
      `http://localhost/api/projects/${otherProject.id}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'X' }),
      }
    );
    const response = await PUT(request, makeContext(otherProject.id, assessmentId));
    expect(response.status).toBe(404);
  });

  it('returns 404 when reassigning to a non-existent project', async () => {
    const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';
    const request = new Request(
      `http://localhost/api/projects/${projectId}/assessments/${assessmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: nonExistentProjectId }),
      }
    );
    const response = await PUT(request, makeContext(projectId, assessmentId));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
    expect(body.error).toBe('Target project not found');
  });
});

describe('DELETE /api/projects/[projectId]/assessments/[id]', () => {
  it('deletes the assessment and returns success', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/projects/${projectId}/assessments/${assessmentId}`),
      makeContext(projectId, assessmentId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: null });
  });

  it('returns 404 when project does not exist', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/projects/no-project/assessments/${assessmentId}`),
      makeContext('no-project', assessmentId)
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment does not exist', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/projects/${projectId}/assessments/no-assessment`),
      makeContext(projectId, 'no-assessment')
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment belongs to a different project', async () => {
    const otherProject = createProject({ name: 'Other' });
    const response = await DELETE(
      new Request(`http://localhost/api/projects/${otherProject.id}/assessments/${assessmentId}`),
      makeContext(otherProject.id, assessmentId)
    );
    expect(response.status).toBe(404);
  });
});
