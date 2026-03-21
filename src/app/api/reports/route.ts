import { NextResponse } from 'next/server';
import { getReports, createReport } from '@/lib/db/reports';
import { getAssessment } from '@/lib/db/assessments';
import { CreateReportSchema } from '@/lib/validators/reports';

export async function GET(_request: Request) {
  try {
    const reports = await getReports();
    return NextResponse.json({ success: true, data: reports });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateReportSchema.safeParse(body);

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

    // Verify all assessments exist
    for (const aId of result.data.assessment_ids) {
      const assessment = await getAssessment(aId);
      if (!assessment) {
        return NextResponse.json(
          { success: false, error: `Assessment not found: ${aId}`, code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    const report = await createReport(result.data);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
