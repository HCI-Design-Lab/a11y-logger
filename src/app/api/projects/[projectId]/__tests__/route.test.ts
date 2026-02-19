// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { createProject } from '@/lib/db/projects';
import { GET, PUT, DELETE } from '../route';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM projects').run();
});

type RouteParams = { params: Promise<{ projectId: string }> };

function makeParams(projectId: string): RouteParams {
  return { params: Promise.resolve({ projectId }) };
}

describe('GET /api/projects/[projectId]', () => {
  it('returns the project', async () => {
    const project = createProject({ name: 'Find Me' });
    const response = await GET(new Request('http://localhost'), makeParams(project.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Find Me');
  });

  it('returns 404 for nonexistent project', async () => {
    const response = await GET(new Request('http://localhost'), makeParams('ghost'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/projects/[projectId]', () => {
  it('updates and returns the project', async () => {
    const project = createProject({ name: 'Old Name' });
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await PUT(request, makeParams(project.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('New Name');
  });

  it('returns 404 for nonexistent project', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    const response = await PUT(request, makeParams('ghost'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid input', async () => {
    const project = createProject({ name: 'Valid' });
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const response = await PUT(request, makeParams(project.id));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/projects/[projectId]', () => {
  it('deletes the project and returns 200', async () => {
    const project = createProject({ name: 'Doomed' });
    const response = await DELETE(new Request('http://localhost'), makeParams(project.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 for nonexistent project', async () => {
    const response = await DELETE(new Request('http://localhost'), makeParams('ghost'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });
});
