import { NextResponse } from 'next/server';
import { getReport, getReportStats, getReportIssues } from '@/lib/db/reports';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { generateReportHtml } from '@/lib/export/report-template';
import type { ExportVariant } from '@/lib/export/report-template';

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

  const variant = (url.searchParams.get('variant') ?? 'default') as ExportVariant;
  if (!['default', 'with-chart', 'with-issues'].includes(variant)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported variant "${variant}". Supported variants: default, with-chart, with-issues`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
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

    // Guard: report must have at least one linked assessment
    if (report.assessment_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Report has no linked assessments', code: 'UNPROCESSABLE_ENTITY' },
        { status: 422 }
      );
    }

    // Derive the project from the first linked assessment
    const firstId = report.assessment_ids[0];
    const assessment = firstId ? getAssessment(firstId) : null;
    const project = assessment ? getProject(assessment.project_id) : null;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'No project found for linked assessments', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const extras =
      variant === 'with-chart'
        ? { stats: getReportStats(report.id) }
        : variant === 'with-issues'
          ? { issues: getReportIssues(report.id) }
          : {};
    const html = generateReportHtml(report, project, variant, extras);

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
