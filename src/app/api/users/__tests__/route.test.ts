// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { setSetting } from '@/lib/db/settings';
import { GET, POST } from '../route';

vi.stubEnv('ENCRYPTION_SECRET', 'a'.repeat(64));

// Mock next/headers so getSession() doesn't throw in test environment
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
  }),
}));

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
  it('returns 200 when auth_enabled is false (auth disabled allows all access)', async () => {
    setSetting('auth_enabled', false);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns 200 when auth_enabled is not set (auth disabled by default)', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});

describe('GET /api/users — auth enabled', () => {
  beforeEach(() => {
    setSetting('auth_enabled', true);
  });

  it('returns 401 when auth is enabled but no session cookie', async () => {
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHENTICATED');
  });
});

describe('POST /api/users — auth disabled', () => {
  it('creates a user when auth is disabled', async () => {
    setSetting('auth_enabled', false);
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

  it('returns 400 for missing required fields when auth is disabled', async () => {
    setSetting('auth_enabled', false);
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
    setSetting('auth_enabled', false);
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
});

describe('POST /api/users — auth enabled', () => {
  beforeEach(() => {
    setSetting('auth_enabled', true);
  });

  it('returns 401 when auth is enabled but no session', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'pass12345' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe('UNAUTHENTICATED');
  });
});
