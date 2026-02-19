// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { setSetting } from '@/lib/db/settings';
import { createUser } from '@/lib/db/users';
import { GET, PUT, DELETE } from '../route';

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
  setSetting('auth_enabled', true);
});

type RouteContext = { params: Promise<{ id: string }> };

function makeContext(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/users/[id]', () => {
  it('returns 403 when auth disabled', async () => {
    setSetting('auth_enabled', false);
    const response = await GET(new Request('http://localhost'), makeContext('any-id'));
    expect(response.status).toBe(403);
  });

  it('returns 404 for non-existent user', async () => {
    const response = await GET(new Request('http://localhost'), makeContext('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('returns user without password_hash', async () => {
    const user = await createUser({ username: 'alice', password: 'pass12345' });
    const response = await GET(new Request('http://localhost'), makeContext(user.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.username).toBe('alice');
    expect(body.data).not.toHaveProperty('password_hash');
  });
});

describe('PUT /api/users/[id]', () => {
  it('updates a user', async () => {
    const user = await createUser({ username: 'alice', password: 'pass12345' });
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alicia' }),
    });
    const response = await PUT(request, makeContext(user.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.username).toBe('alicia');
  });

  it('returns 400 for empty update body', async () => {
    const user = await createUser({ username: 'alice', password: 'pass12345' });
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, makeContext(user.id));
    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'new-name' }),
    });
    const response = await PUT(request, makeContext('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('returns 409 when updating to an already taken username', async () => {
    await createUser({ username: 'alice', password: 'pass12345' });
    const bob = await createUser({ username: 'bob', password: 'pass12345' });
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }), // already taken
    });
    const response = await PUT(request, makeContext(bob.id));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('CONFLICT');
  });
});

describe('DELETE /api/users/[id]', () => {
  it('deletes a user and returns 204', async () => {
    const user = await createUser({ username: 'alice', password: 'pass12345' });
    const response = await DELETE(new Request('http://localhost'), makeContext(user.id));
    expect(response.status).toBe(204);
  });

  it('returns 404 for non-existent user', async () => {
    const response = await DELETE(new Request('http://localhost'), makeContext('nonexistent'));
    expect(response.status).toBe(404);
  });
});
