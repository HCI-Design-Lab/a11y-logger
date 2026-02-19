// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createReport } from '@/lib/db/reports';
import { GET, POST } from '../route';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM reports').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('GET /api/reports', () => {
  it('returns empty array when no reports exist', async () => {
    const response = await GET(new Request('http://localhost/api/reports'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns all reports when no projectId filter', async () => {
    const other = createProject({ name: 'Other' });
    createReport({ title: 'Report A', project_id: projectId });
    createReport({ title: 'Report B', project_id: other.id });
    const response = await GET(new Request('http://localhost/api/reports'));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('filters by projectId query param', async () => {
    const other = createProject({ name: 'Other' });
    createReport({ title: 'Mine', project_id: projectId });
    createReport({ title: 'Theirs', project_id: other.id });
    const response = await GET(new Request(`http://localhost/api/reports?projectId=${projectId}`));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Mine');
  });
});

describe('POST /api/reports', () => {
  it('creates a report and returns 201', async () => {
    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Report', project_id: projectId }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Report');
    expect(body.data.id).toBeDefined();
    expect(body.data.project_id).toBe(projectId);
    expect(body.data.status).toBe('draft');
  });

  it('creates a report with content sections', async () => {
    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Report with Sections',
        project_id: projectId,
        content: [{ title: 'Overview', body: '## Summary' }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.content).toBe(JSON.stringify([{ title: 'Overview', body: '## Summary' }]));
  });

  it('returns 400 for missing title', async () => {
    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing project_id', async () => {
    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Orphan' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Report', project_id: 'nonexistent' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
