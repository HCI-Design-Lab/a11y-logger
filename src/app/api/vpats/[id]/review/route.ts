import { NextResponse } from 'next/server';
import { z } from 'zod';
import { reviewVpat, VpatNotFoundError, UnresolvedRowsError } from '@/lib/db/vpats';

const ReviewSchema = z.object({
  reviewer_name: z.string().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = ReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'reviewer_name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    const reviewed = await reviewVpat(id, result.data.reviewer_name);
    return NextResponse.json({ success: true, data: reviewed });
  } catch (err) {
    if (err instanceof VpatNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (err instanceof UnresolvedRowsError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'UNRESOLVED_ROWS' },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to review VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
