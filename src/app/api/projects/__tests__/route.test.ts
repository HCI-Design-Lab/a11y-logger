// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { GET, POST } from '../route';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM projects').run();
});

describe('GET /api/projects', () => {
  it('returns success with empty array when no projects exist', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns all projects', async () => {
    await POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Project Alpha' }),
      })
    );

    const response = await GET();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Project Alpha');
  });
});

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('New Project');
    expect(body.data.id).toBeDefined();
  });

  it('returns 400 for missing name', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid product_url', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'P', product_url: 'not-a-url' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
