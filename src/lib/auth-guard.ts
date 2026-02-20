import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db/settings';
import { getSession } from '@/lib/auth/session';

export async function requireAuth(): Promise<NextResponse | null> {
  const enabled = getSetting('auth_enabled');
  if (enabled !== 'true' && enabled !== true) return null; // auth disabled, all requests allowed

  const userId = await getSession();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }
  return null;
}
