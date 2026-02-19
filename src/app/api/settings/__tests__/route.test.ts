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

describe('GET /api/settings', () => {
  it('returns success with empty object when no settings exist', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data: {} });
  });

  it('returns all settings with sensitive keys redacted', async () => {
    setSetting('ai_provider', 'openai');
    setSetting('ai_api_key', 'sk-secret');
    const response = await GET();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.ai_provider).toBe('openai');
    expect(body.data.ai_api_key).toBe('[REDACTED]');
  });
});

describe('PUT /api/settings', () => {
  it('updates multiple settings and returns redacted values', async () => {
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_provider: 'anthropic', auth_enabled: true }),
    });
    const response = await PUT(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.ai_provider).toBe('anthropic');
    expect(body.data.auth_enabled).toBe(true);
  });

  it('returns 400 for invalid input (not an object)', async () => {
    const request = new Request('http://localhost/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('not-an-object'),
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
