import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getReports, createReport } from '@/lib/db/reports';
import { CreateReportSchema } from '@/lib/validators/reports';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') ?? undefined;
    const reports = getReports(projectId);
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

    const project = getProject(result.data.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const report = createReport(result.data);
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create report', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
