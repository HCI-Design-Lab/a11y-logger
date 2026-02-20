import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db/settings';
import { getUsers } from '@/lib/db/users';

export async function GET() {
  const enabled = getSetting('auth_enabled');
  return NextResponse.json({ success: true, data: { enabled: Boolean(enabled) } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const enabled = Boolean(body.enabled);

  if (enabled) {
    const users = getUsers();
    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot enable auth: no user accounts exist. Create at least one user first.',
          code: 'NO_USERS',
        },
        { status: 409 }
      );
    }
  }

  setSetting('auth_enabled', enabled);

  const response = NextResponse.json({ success: true, data: { enabled } });
  // Set cookie so middleware can read it (not httpOnly so middleware Edge runtime can access)
  response.cookies.set('auth_enabled', String(enabled), {
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return response;
}
