// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { GET, POST } from '../route';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
});

function makeContext(id: string) {
  return { params: Promise.resolve({ projectId: id }) };
}

describe('GET /api/projects/[projectId]/assessments', () => {
  it('returns empty array when no assessments exist', async () => {
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments`),
      makeContext(projectId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns assessments for the project', async () => {
    await createAssessment(projectId, { name: 'Audit One' });
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments`),
      makeContext(projectId)
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Audit One');
  });

  it('does not return assessments belonging to another project', async () => {
    const other = await createProject({ name: 'Other Project' });
    await createAssessment(other.id, { name: 'Other Audit' });
    await createAssessment(projectId, { name: 'My Audit' });
    const response = await GET(
      new Request(`http://localhost/api/projects/${projectId}/assessments`),
      makeContext(projectId)
    );
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('My Audit');
  });

  it('returns 404 when project does not exist', async () => {
    const response = await GET(
      new Request('http://localhost/api/projects/nonexistent-id/assessments'),
      makeContext('nonexistent-id')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/projects/[projectId]/assessments', () => {
  it('creates an assessment and returns 201', async () => {
    const request = new Request(`http://localhost/api/projects/${projectId}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Audit' }),
    });
    const response = await POST(request, makeContext(projectId));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('New Audit');
    expect(body.data.id).toBeDefined();
    expect(body.data.project_id).toBe(projectId);
  });

  it('returns 400 for missing name', async () => {
    const request = new Request(`http://localhost/api/projects/${projectId}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request, makeContext(projectId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when test_date_end is before test_date_start', async () => {
    const request = new Request(`http://localhost/api/projects/${projectId}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Dates',
        test_date_start: '2024-01-20T00:00:00.000Z',
        test_date_end: '2024-01-10T00:00:00.000Z',
      }),
    });
    const response = await POST(request, makeContext(projectId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request('http://localhost/api/projects/nonexistent-id/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Orphan Audit' }),
    });
    const response = await POST(request, makeContext('nonexistent-id'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});
