import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';
import { getReport } from '@/lib/db/reports';

export async function POST(request: Request) {
  const ai = getAIProvider();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'AI not configured', code: 'AI_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { projectId, reportId } = body as Record<string, unknown>;

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return NextResponse.json(
      { success: false, error: 'projectId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }
  if (typeof reportId !== 'string' || !reportId.trim()) {
    return NextResponse.json(
      { success: false, error: 'reportId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const report = getReport(reportId);
  if (!report) {
    return NextResponse.json(
      { success: false, error: 'Report not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  if (report.project_id !== projectId) {
    return NextResponse.json(
      { success: false, error: 'Report not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Gather context: assessments and all issues for this project
  const assessments = getAssessments(projectId);
  const allIssues = assessments.flatMap((a) => getIssues(a.id));

  const context = [
    `Project: ${project.name}`,
    project.description ? `Description: ${project.description}` : '',
    `Report: ${report.title} (${report.type})`,
    `Total assessments: ${assessments.length}`,
    `Total issues: ${allIssues.length}`,
    allIssues.length > 0
      ? `Issues:\n${allIssues
          .map(
            (i) =>
              `- [${i.severity.toUpperCase()}] ${i.title}${i.wcag_codes.length ? ` (WCAG: ${i.wcag_codes.join(', ')})` : ''}`
          )
          .join('\n')}`
      : 'No issues found.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const summary = await ai.generateReportSection(context, 'Executive Summary');
    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
