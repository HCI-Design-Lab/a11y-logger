import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { createHmac } from 'crypto';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { createSession, getSession, destroySession } from '../session';

const SECRET = 'offline-default-secret-change-in-production';

function makeSignedToken(userId: string, nonce: string): string {
  const payload = `${userId}:${nonce}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function makeCookieStore(overrides: Partial<ReadonlyRequestCookies>): ReadonlyRequestCookies {
  return {
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as ReadonlyRequestCookies;
}

describe('session management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createSession sets a cookie with a signed token', async () => {
    const mockSet = vi.fn();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ set: mockSet }));
    await createSession('user-123');
    expect(mockSet).toHaveBeenCalledWith(
      'session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: false, path: '/' })
    );
    // The token value should not be the raw userId
    const tokenValue = mockSet.mock.calls[0][1] as string;
    expect(tokenValue).not.toBe('user-123');
    // Token should have at least 3 colon-separated parts (userId:nonce:sig)
    expect(tokenValue.split(':').length).toBeGreaterThanOrEqual(3);
  });

  it('getSession returns userId from a valid signed cookie', async () => {
    const validToken = makeSignedToken('user-123', 'some-nonce-value');
    const mockGet = vi.fn().mockReturnValue({ value: validToken });
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ get: mockGet }));
    const userId = await getSession();
    expect(userId).toBe('user-123');
  });

  it('getSession returns null when no cookie', async () => {
    const mockGet = vi.fn().mockReturnValue(undefined);
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ get: mockGet }));
    const userId = await getSession();
    expect(userId).toBeNull();
  });

  it('getSession returns null for a raw (unsigned) userId token', async () => {
    const mockGet = vi.fn().mockReturnValue({ value: 'user-123' });
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ get: mockGet }));
    const userId = await getSession();
    expect(userId).toBeNull();
  });

  it('getSession returns null for a tampered token', async () => {
    const validToken = makeSignedToken('user-123', 'some-nonce-value');
    // Tamper with the userId part
    const tampered = 'evil-user:some-nonce-value:' + validToken.split(':').pop();
    const mockGet = vi.fn().mockReturnValue({ value: tampered });
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ get: mockGet }));
    const userId = await getSession();
    expect(userId).toBeNull();
  });

  it('destroySession deletes the cookie', async () => {
    const mockDelete = vi.fn();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ delete: mockDelete }));
    await destroySession();
    expect(mockDelete).toHaveBeenCalledWith('session');
  });
});
