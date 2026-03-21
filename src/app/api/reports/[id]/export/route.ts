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
  const autoPrint = url.searchParams.get('autoprint') === 'true';

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

  const VALID_VARIANTS = [
    'default',
    'with-chart',
    'with-issues',
    'with-all',
  ] as const satisfies readonly ExportVariant[];
  const rawVariant = autoPrint ? 'with-all' : (url.searchParams.get('variant') ?? 'default');
  if (!(VALID_VARIANTS as readonly string[]).includes(rawVariant)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported variant "${rawVariant}". Supported variants: default, with-chart, with-issues, with-all`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }
  const variant = rawVariant as ExportVariant;

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

    const needsStats = variant === 'with-chart' || variant === 'with-all';
    const needsIssues = variant === 'with-issues' || variant === 'with-all';
    const extras = {
      ...(needsStats ? { stats: getReportStats(report.id) } : {}),
      ...(needsIssues ? { issues: getReportIssues(report.id) } : {}),
    };
    const baseUrl = new URL(request.url).origin;
    const html = generateReportHtml(report, project, variant, extras, baseUrl, autoPrint);

    // Sanitize title for use in filename
    const safeTitle =
      report.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'untitled';
    const filename = `report-${safeTitle}.html`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...(autoPrint ? {} : { 'Content-Disposition': `attachment; filename="${filename}"` }),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate export', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
