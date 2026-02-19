import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db/settings';

export function requireAuth(): NextResponse | null {
  const enabled = getSetting('auth_enabled');
  if (!enabled) {
    return NextResponse.json(
      {
        success: false,
        error: 'User management requires auth to be enabled',
        code: 'AUTH_NOT_ENABLED',
      },
      { status: 403 }
    );
  }
  return null;
}
