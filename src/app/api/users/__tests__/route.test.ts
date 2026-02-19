// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { setSetting } from '@/lib/db/settings';
import { GET, POST } from '../route';

vi.stubEnv('ENCRYPTION_SECRET', 'a'.repeat(64));

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM users').run();
  getDb().prepare('DELETE FROM settings').run();
});

describe('GET /api/users — auth disabled', () => {
  it('returns 403 when auth_enabled is false', async () => {
    setSetting('auth_enabled', false);
    const response = await GET();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe('AUTH_NOT_ENABLED');
  });

  it('returns 403 when auth_enabled is not set', async () => {
    const response = await GET();
    expect(response.status).toBe(403);
  });
});

describe('GET /api/users — auth enabled', () => {
  beforeEach(() => {
    setSetting('auth_enabled', true);
  });

  it('returns empty array when no users exist', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: [] });
  });

  it('returns users without password_hash', async () => {
    await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'alice', password: 'password123' }),
      })
    );
    const response = await GET();
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty('password_hash');
  });
});

describe('POST /api/users — auth enabled', () => {
  beforeEach(() => {
    setSetting('auth_enabled', true);
  });

  it('creates a user and returns 201', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'secure123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('alice');
    expect(body.data).not.toHaveProperty('password_hash');
  });

  it('returns 400 for missing required fields', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }), // missing password
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for duplicate username', async () => {
    const payload = { username: 'alice', password: 'pass12345' };
    await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    const response = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('CONFLICT');
  });

  it('returns 403 when auth_enabled is false', async () => {
    setSetting('auth_enabled', false);
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'pass12345' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
