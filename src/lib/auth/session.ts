import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SECRET = process.env.ENCRYPTION_SECRET ?? 'offline-default-secret-change-in-production';

function signToken(userId: string): string {
  const nonce = crypto.randomUUID();
  const payload = `${userId}:${nonce}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function verifyToken(token: string): string | null {
  const lastColon = token.lastIndexOf(':');
  if (lastColon < 0) return null;
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch {
    return null;
  }
  const parts = payload.split(':');
  return parts.length >= 2 ? (parts[0] ?? null) : null;
}

export async function createSession(userId: string): Promise<void> {
  const token = signToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
