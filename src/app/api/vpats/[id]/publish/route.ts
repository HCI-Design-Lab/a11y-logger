import { NextResponse } from 'next/server';
import { publishVpat } from '@/lib/db/vpats';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const published = publishVpat(id);
    return NextResponse.json({ success: true, data: published });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish';
    if (message.startsWith('VPAT not found')) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (message.includes('unresolved')) {
      return NextResponse.json(
        { success: false, error: message, code: 'UNRESOLVED_ROWS' },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to publish', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
