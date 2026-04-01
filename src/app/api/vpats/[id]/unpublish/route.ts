/**
 * VPAT Unpublish API — /api/vpats/[id]/unpublish
 *
 * POST /api/vpats/[id]/unpublish   Revert a published VPAT back to draft status
 */

import { NextResponse } from 'next/server';
import { unpublishVpat, VpatNotFoundError, NotPublishedError } from '@/lib/db/vpats';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const updated = await unpublishVpat(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof VpatNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (err instanceof NotPublishedError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'NOT_PUBLISHED' },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to unpublish', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
