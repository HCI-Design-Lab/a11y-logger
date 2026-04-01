/**
 * Auth Logout API — /api/auth/logout
 *
 * POST /api/auth/logout   Destroy the current session and log out
 */

import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true, data: null });
}
