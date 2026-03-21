import { NextResponse } from 'next/server';
import { getReport, publishReport, unpublishReport } from '@/lib/db/reports';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const existing = await getReport(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const published = await publishReport(id);
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

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const existing = await getReport(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const unpublished = await unpublishReport(id);
    if (!unpublished) {
      return NextResponse.json(
        { success: false, error: 'Failed to unpublish report', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: unpublished });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to unpublish report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
