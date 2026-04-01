/**
 * Issues API — /api/projects/[projectId]/assessments/[assessmentId]/issues
 *
 * GET  /api/projects/[projectId]/assessments/[assessmentId]/issues   List all issues for an assessment
 * POST /api/projects/[projectId]/assessments/[assessmentId]/issues   Create a new issue
 */

import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssues, createIssue } from '@/lib/db/issues';
import type { IssueFilters } from '@/lib/db/issues';
import { CreateIssueSchema } from '@/lib/validators/issues';

type RouteContext = { params: Promise<{ projectId: string; assessmentId: string }> };

async function resolveParents(projectId: string, assessmentId: string) {
  const project = await getProject(projectId);
  if (!project) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  const assessment = await getAssessment(assessmentId);
  if (!assessment || assessment.project_id !== projectId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Assessment not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  return { project, assessment };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  try {
    const resolved = await resolveParents(projectId, assessmentId);
    if (resolved.error) return resolved.error;

    const url = new URL(request.url);
    const filters: IssueFilters = {};
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const wcag_code = url.searchParams.get('wcag_code');
    const tag = url.searchParams.get('tag');

    if (severity) filters.severity = severity as IssueFilters['severity'];
    if (status) filters.status = status as IssueFilters['status'];
    if (wcag_code) filters.wcag_code = wcag_code;
    if (tag) filters.tag = tag;

    const issues = await getIssues(assessmentId, filters);
    return NextResponse.json({ success: true, data: issues });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  try {
    const resolved = await resolveParents(projectId, assessmentId);
    if (resolved.error) return resolved.error;

    const body = await request.json();
    const result = CreateIssueSchema.safeParse(body);

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

    const issue = await createIssue(assessmentId, result.data);
    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create issue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
