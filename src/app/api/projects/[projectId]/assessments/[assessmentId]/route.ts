/**
 * Assessment API — /api/projects/[projectId]/assessments/[assessmentId]
 *
 * GET    /api/projects/[projectId]/assessments/[assessmentId]   Get a single assessment
 * PUT    /api/projects/[projectId]/assessments/[assessmentId]   Update an assessment
 * DELETE /api/projects/[projectId]/assessments/[assessmentId]   Delete an assessment
 */

import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getAssessment, updateAssessment, deleteAssessment } from '@/lib/db/assessments';
import { UpdateAssessmentSchema } from '@/lib/validators/assessments';

type RouteContext = { params: Promise<{ projectId: string; assessmentId: string }> };

async function resolveAssessment(projectId: string, assessmentId: string) {
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

  return { assessment };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  try {
    const resolved = await resolveAssessment(projectId, assessmentId);
    if (resolved.error) return resolved.error;
    return NextResponse.json({ success: true, data: resolved.assessment });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  try {
    const resolved = await resolveAssessment(projectId, assessmentId);
    if (resolved.error) return resolved.error;

    const body = await request.json();
    const result = UpdateAssessmentSchema.safeParse(body);

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

    if (result.data.project_id && result.data.project_id !== projectId) {
      const targetProject = await getProject(result.data.project_id);
      if (!targetProject) {
        return NextResponse.json(
          { success: false, error: 'Target project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    const updated = await updateAssessment(assessmentId, result.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update assessment', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  try {
    const resolved = await resolveAssessment(projectId, assessmentId);
    if (resolved.error) return resolved.error;

    await deleteAssessment(assessmentId);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete assessment', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
