import { NextResponse } from 'next/server';
import { getReport, updateReport, deleteReport } from '@/lib/db/reports';
import { UpdateReportSchema } from '@/lib/validators/reports';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const existing = await getReport(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existing.status === 'published') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a published report', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const result = UpdateReportSchema.safeParse(body);

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

    const updated = await updateReport(id, result.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update report', code: 'INTERNAL_ERROR' },
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

    await deleteReport(id);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
