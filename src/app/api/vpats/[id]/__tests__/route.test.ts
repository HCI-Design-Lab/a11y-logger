// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { createVpat } from '@/lib/db/vpats';
import { GET, PUT, DELETE } from '../route';

let projectId: string;
let vpatId: string;

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
  const vpat = createVpat({ title: 'Existing VPAT', project_id: projectId });
  vpatId = vpat.id;
});

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/vpats/[id]', () => {
  it('returns the VPAT by id', async () => {
    const response = await GET(
      new Request(`http://localhost/api/vpats/${vpatId}`),
      makeContext(vpatId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(vpatId);
    expect(body.data.title).toBe('Existing VPAT');
    expect(body.data.criterion_rows).toBeDefined();
  });

  it('returns 404 for nonexistent id', async () => {
    const response = await GET(
      new Request('http://localhost/api/vpats/nonexistent'),
      makeContext('nonexistent')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/vpats/[id]', () => {
  it('updates the VPAT and returns it', async () => {
    const request = new Request(`http://localhost/api/vpats/${vpatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const response = await PUT(request, makeContext(vpatId));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Title');
  });

  it('returns 400 for invalid input', async () => {
    const request = new Request(`http://localhost/api/vpats/${vpatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const response = await PUT(request, makeContext(vpatId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for nonexistent id', async () => {
    const request = new Request('http://localhost/api/vpats/nonexistent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New' }),
    });
    const response = await PUT(request, makeContext('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('returns 400 for empty body PUT', async () => {
    const request = new Request(`http://localhost/api/vpats/${vpatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, makeContext(vpatId));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/vpats/[id]', () => {
  it('deletes the VPAT and returns success', async () => {
    const response = await DELETE(
      new Request(`http://localhost/api/vpats/${vpatId}`, { method: 'DELETE' }),
      makeContext(vpatId)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('returns 404 for nonexistent id', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/vpats/nonexistent', { method: 'DELETE' }),
      makeContext('nonexistent')
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
