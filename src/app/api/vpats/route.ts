import { NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getVpats, createVpat, getInvalidIssueIds } from '@/lib/db/vpats';
import { CreateVpatSchema } from '@/lib/validators/vpats';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') ?? undefined;
    const vpats = getVpats(projectId);
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

    const project = getProject(result.data.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate all related_issue_ids reference existing issues
    const allIssueIds = result.data.criteria_rows.flatMap((row) => row.related_issue_ids);
    if (allIssueIds.length > 0) {
      const invalid = getInvalidIssueIds(allIssueIds);
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Issue IDs not found: ${invalid.join(', ')}`,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
    }

    const vpat = createVpat(result.data);
    return NextResponse.json({ success: true, data: vpat }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
