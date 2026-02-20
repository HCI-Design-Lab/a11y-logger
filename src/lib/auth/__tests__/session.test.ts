import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { createSession, getSession, destroySession } from '../session';

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

  it('createSession sets a cookie', async () => {
    const mockSet = vi.fn();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ set: mockSet }));
    await createSession('user-123');
    expect(mockSet).toHaveBeenCalledWith(
      'session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: false, path: '/' })
    );
  });

  it('getSession returns userId from valid cookie', async () => {
    const mockGet = vi.fn().mockReturnValue({ value: 'user-123' });
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

  it('destroySession deletes the cookie', async () => {
    const mockDelete = vi.fn();
    vi.mocked(cookies).mockResolvedValue(makeCookieStore({ delete: mockDelete }));
    await destroySession();
    expect(mockDelete).toHaveBeenCalledWith('session');
  });
});
