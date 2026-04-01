/**
 * User API — /api/users/[id]
 *
 * GET    /api/users/[id]   Get a single user by ID
 * PUT    /api/users/[id]   Update a user's details or password
 * DELETE /api/users/[id]   Delete a user
 */

import { NextResponse } from 'next/server';
import { getUser, updateUser, deleteUser } from '@/lib/db/users';
import { UpdateUserSchema } from '@/lib/validators/users';
import { requireAuth } from '@/lib/auth-guard';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const user = await getUser(id);

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
    const authError = await requireAuth();
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
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'Username already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update user', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const deleted = await deleteUser(id);

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
