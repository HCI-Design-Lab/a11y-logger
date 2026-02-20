import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/settings', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  getUsers: vi.fn(),
}));

import { getSetting, setSetting } from '@/lib/db/settings';
import { getUsers } from '@/lib/db/users';
import { GET, POST } from '../route';

describe('GET /api/auth/toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns enabled: false when auth is disabled', async () => {
    vi.mocked(getSetting).mockReturnValue(false);
    const res = await GET();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.enabled).toBe(false);
  });

  it('returns enabled: true when auth is enabled', async () => {
    vi.mocked(getSetting).mockReturnValue(true);
    const res = await GET();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.enabled).toBe(true);
  });
});

describe('POST /api/auth/toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables auth when users exist', async () => {
    vi.mocked(getUsers).mockReturnValue([
      { id: 'user-1', username: 'admin', role: 'admin', created_at: '', updated_at: '' },
    ]);
    const req = new Request('http://localhost/api/auth/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.enabled).toBe(true);
    expect(setSetting).toHaveBeenCalledWith('auth_enabled', true);
  });

  it('returns 409 when trying to enable auth with no users', async () => {
    vi.mocked(getUsers).mockReturnValue([]);
    const req = new Request('http://localhost/api/auth/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('NO_USERS');
    expect(setSetting).not.toHaveBeenCalled();
  });

  it('disables auth without checking users', async () => {
    const req = new Request('http://localhost/api/auth/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.enabled).toBe(false);
    expect(setSetting).toHaveBeenCalledWith('auth_enabled', false);
    expect(getUsers).not.toHaveBeenCalled();
  });

  it('sets the auth_enabled cookie with sameSite lax', async () => {
    vi.mocked(getUsers).mockReturnValue([
      { id: 'user-1', username: 'admin', role: 'admin', created_at: '', updated_at: '' },
    ]);
    const req = new Request('http://localhost/api/auth/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('auth_enabled=true');
    expect(setCookieHeader?.toLowerCase()).toContain('samesite=lax');
  });
});
