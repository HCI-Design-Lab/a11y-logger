/**
 * Issue API — /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]
 *
 * GET    /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]   Get a single issue
 * PUT    /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]   Update an issue
 * DELETE /api/projects/[projectId]/assessments/[assessmentId]/issues/[issueId]   Delete an issue
 */

import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssue, updateIssue, deleteIssue } from '@/lib/db/issues';
import { UpdateIssueSchema } from '@/lib/validators/issues';
import { getSession } from '@/lib/auth/session';

type RouteContext = {
  params: Promise<{ projectId: string; assessmentId: string; issueId: string }>;
};

async function resolveIssueFromContext(projectId: string, assessmentId: string, issueId: string) {
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

  const issue = await getIssue(issueId);
  if (!issue || issue.assessment_id !== assessmentId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Issue not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  return { project, assessment, issue };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId, assessmentId, issueId } = await params;

  try {
    const resolved = await resolveIssueFromContext(projectId, assessmentId, issueId);
    if (resolved.error) return resolved.error;
    return NextResponse.json({ success: true, data: resolved.issue });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { projectId, assessmentId, issueId } = await params;
  const userId = await getSession();

  try {
    const resolved = await resolveIssueFromContext(projectId, assessmentId, issueId);
    if (resolved.error) return resolved.error;

    const body = await request.json();
    const result = UpdateIssueSchema.safeParse(body);

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

    const updated = await updateIssue(issueId, result.data, userId);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Issue not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update issue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { projectId, assessmentId, issueId } = await params;

  try {
    const resolved = await resolveIssueFromContext(projectId, assessmentId, issueId);
    if (resolved.error) return resolved.error;

    await deleteIssue(issueId);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete issue', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
