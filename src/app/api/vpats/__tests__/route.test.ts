// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { GET, POST } from '../route';

let projectId: string;

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM vpats').run();
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
});

describe('GET /api/vpats', () => {
  it('returns empty array when no VPATs exist', async () => {
    const response = await GET(new Request('http://localhost/api/vpats'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns all VPATs when no projectId filter', async () => {
    createVpat({ title: 'VPAT A', project_id: projectId });
    createVpat({ title: 'VPAT B', project_id: projectId });
    const response = await GET(new Request('http://localhost/api/vpats'));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('filters by projectId query param', async () => {
    const other = createProject({ name: 'Other' });
    createVpat({ title: 'Mine', project_id: projectId });
    createVpat({ title: 'Theirs', project_id: other.id });

    const response = await GET(new Request(`http://localhost/api/vpats?projectId=${projectId}`));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Mine');
  });
});

describe('POST /api/vpats', () => {
  it('creates a VPAT and returns 201', async () => {
    const request = new Request('http://localhost/api/vpats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New VPAT', project_id: projectId }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New VPAT');
    expect(body.data.id).toBeDefined();
    expect(body.data.project_id).toBe(projectId);
    expect(body.data.status).toBe('draft');
    expect(body.data.version_number).toBe(1);
  });

  it('returns 400 for missing title', async () => {
    const request = new Request('http://localhost/api/vpats', {
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

  it('returns 400 for invalid wcag_scope code', async () => {
    const request = new Request('http://localhost/api/vpats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'VPAT', project_id: projectId, wcag_scope: ['9.9.9'] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when project does not exist', async () => {
    const request = new Request('http://localhost/api/vpats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'VPAT', project_id: 'nonexistent-project' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 400 when criteria_rows contains nonexistent issue ids', async () => {
    const request = new Request('http://localhost/api/vpats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'VPAT',
        project_id: projectId,
        criteria_rows: [
          {
            criterion_code: '1.1.1',
            conformance: 'supports',
            related_issue_ids: ['nonexistent-issue-id'],
          },
        ],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
