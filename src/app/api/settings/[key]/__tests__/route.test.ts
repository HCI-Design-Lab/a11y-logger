// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '@/lib/db/index';
import { setSetting } from '@/lib/db/settings';
import { GET, PUT } from '../route';

vi.stubEnv('ENCRYPTION_SECRET', 'a'.repeat(64));

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM settings').run();
});

type RouteContext = { params: Promise<{ key: string }> };

function makeContext(key: string): RouteContext {
  return { params: Promise.resolve({ key }) };
}

describe('GET /api/settings/[key]', () => {
  it('returns a single setting value', async () => {
    setSetting('ai_provider', 'openai');
    const response = await GET(new Request('http://localhost'), makeContext('ai_provider'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: { key: 'ai_provider', value: 'openai' } });
  });

  it('returns 404 for a non-existent key', async () => {
    const response = await GET(new Request('http://localhost'), makeContext('nonexistent'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('redacts sensitive keys', async () => {
    setSetting('ai_api_key', 'sk-real-key');
    const response = await GET(new Request('http://localhost'), makeContext('ai_api_key'));
    const body = await response.json();
    expect(body.data.value).toBe('[REDACTED]');
  });
});

describe('PUT /api/settings/[key]', () => {
  it('creates or updates a setting and returns it', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'anthropic' }),
    });
    const response = await PUT(request, makeContext('ai_provider'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({ key: 'ai_provider', value: 'anthropic' });
  });

  it('returns 400 when body is missing value field', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, makeContext('ai_provider'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
