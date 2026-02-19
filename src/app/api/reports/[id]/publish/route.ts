import { NextResponse } from 'next/server';
import { getReport, publishReport } from '@/lib/db/reports';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const existing = getReport(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const published = publishReport(id);
    if (!published) {
      return NextResponse.json(
        { success: false, error: 'Failed to publish report', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: published });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to publish report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
