import { NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/db/users';
import { CreateUserSchema } from '@/lib/validators/users';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    return NextResponse.json({ success: true, data: getUsers() });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const result = CreateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues.map((i) => i.message).join('; '),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const user = await createUser(result.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'Username already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create user', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
