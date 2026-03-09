import { NextResponse } from 'next/server';
import { getReport } from '@/lib/db/reports';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { generateReportHtml } from '@/lib/export/report-template';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'html') as string;

  // Validate format
  if (format !== 'html' && format !== 'pdf') {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported format "${format}". Supported formats: html, pdf`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  // PDF requires Puppeteer which is not a production dependency
  if (format === 'pdf') {
    return NextResponse.json(
      {
        success: false,
        error:
          'PDF export requires Puppeteer which is not installed. ' +
          'Use HTML export (?format=html) and print to PDF from your browser using File > Print > Save as PDF.',
        code: 'NOT_IMPLEMENTED',
      },
      { status: 501 }
    );
  }

  try {
    const report = getReport(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Derive the project from the first linked assessment
    const firstAssessmentId = report.assessment_ids[0];
    const assessment = firstAssessmentId ? getAssessment(firstAssessmentId) : null;
    const project = assessment ? getProject(assessment.project_id) : null;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const html = generateReportHtml(report, project);

    // Sanitize title for use in filename
    const safeTitle = report.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    const filename = `report-${safeTitle}.html`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate export', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
