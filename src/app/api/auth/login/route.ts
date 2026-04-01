/**
 * Auth Login API — /api/auth/login
 *
 * POST /api/auth/login   Authenticate a user and create a session
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '@/lib/db/users';
import { createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body ?? {};

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    success: true,
    data: { id: user.id, username: user.username, role: user.role },
  });
}
