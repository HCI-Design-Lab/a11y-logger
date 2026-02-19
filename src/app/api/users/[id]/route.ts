import { NextResponse } from 'next/server';
import { getUser, updateUser, deleteUser } from '@/lib/db/users';
import { getSetting } from '@/lib/db/settings';
import { UpdateUserSchema } from '@/lib/validators/users';

type RouteContext = { params: Promise<{ id: string }> };

function requireAuth(): NextResponse | null {
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

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const authError = requireAuth();
    if (authError) return authError;

    const user = getUser(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const authError = requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const result = UpdateUserSchema.safeParse(body);

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

    const updated = await updateUser(id, result.data);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update user', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const authError = requireAuth();
    if (authError) return authError;

    const deleted = deleteUser(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
