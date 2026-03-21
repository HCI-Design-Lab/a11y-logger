import { NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject } from '@/lib/db/projects';
import { UpdateProjectSchema } from '@/lib/validators/projects';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: project });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { projectId } = await params;

  const body = await request.json();
  const result = UpdateProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error.message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const project = await updateProject(projectId, result.data);

  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: project });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { projectId } = await params;
  const deleted = await deleteProject(projectId);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
