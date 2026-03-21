import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getVpats, createVpat } from '@/lib/db/vpats';
import { CreateVpatSchema } from '@/lib/validators/vpats';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') ?? undefined;
    const vpats = await getVpats(projectId);
    return NextResponse.json({ success: true, data: vpats });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VPATs', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateVpatSchema.safeParse(body);

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

    const project = await getProject(result.data.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const vpat = await createVpat(result.data);
    return NextResponse.json({ success: true, data: vpat }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
