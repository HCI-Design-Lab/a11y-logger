import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getAssessments, createAssessment } from '@/lib/db/assessments';
import { CreateAssessmentSchema } from '@/lib/validators/assessments';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params;

  try {
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const assessments = getAssessments(projectId);
    return NextResponse.json({ success: true, data: assessments });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessments', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { projectId } = await params;

  try {
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = CreateAssessmentSchema.safeParse(body);

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

    const assessment = createAssessment(projectId, result.data);
    return NextResponse.json({ success: true, data: assessment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create assessment', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
