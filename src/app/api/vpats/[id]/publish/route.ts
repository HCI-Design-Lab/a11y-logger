import { NextResponse } from 'next/server';
import {
  publishVpat,
  VpatNotFoundError,
  UnresolvedRowsError,
  NotReviewedError,
} from '@/lib/db/vpats';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const published = await publishVpat(id);
    return NextResponse.json({ success: true, data: published });
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
    if (err instanceof NotReviewedError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'NOT_REVIEWED' },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to publish', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
