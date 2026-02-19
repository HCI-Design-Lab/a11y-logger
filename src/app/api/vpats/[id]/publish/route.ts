import { NextResponse } from 'next/server';
import { getVpat, publishVpat } from '@/lib/db/vpats';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const existing = getVpat(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const published = publishVpat(id);
    return NextResponse.json({ success: true, data: published });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to publish VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
