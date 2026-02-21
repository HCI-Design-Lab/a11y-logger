import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db/users', () => ({
  getUserByUsername: vi.fn(),
}));
vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}));
vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn(),
}));

import { getUserByUsername } from '@/lib/db/users';
import bcrypt from 'bcryptjs';
import { POST } from '../route';
import type { NextRequest } from 'next/server';

describe('POST /api/auth/login', () => {
  it('returns 400 for missing credentials', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
  });

  it('returns 401 for unknown username', async () => {
    vi.mocked(getUserByUsername).mockReturnValue(null);
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'unknown', password: 'pass' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    vi.mocked(getUserByUsername).mockReturnValue({
      id: '1',
      username: 'testuser',
      password_hash: 'hash',
      role: 'admin',
      created_at: '',
      updated_at: '',
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it('returns 200 and creates session on valid credentials', async () => {
    vi.mocked(getUserByUsername).mockReturnValue({
      id: '1',
      username: 'testuser',
      password_hash: 'hash',
      role: 'admin',
      created_at: '',
      updated_at: '',
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'correct' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
