import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createIssue } from '@/lib/db/issues';
import { getAssessment } from '@/lib/db/assessments';
import { getProject } from '@/lib/db/projects';
import { mapRows } from '@/lib/csv/map-rows';

const ImportRequestSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())),
  mapping: z.record(z.string(), z.string()),
});

type RouteContext = { params: Promise<{ projectId: string; assessmentId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { projectId, assessmentId } = await params;

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const assessment = await getAssessment(assessmentId);
  if (!assessment) {
    return NextResponse.json(
      { success: false, error: 'Assessment not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const result = ImportRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { rows, mapping } = result.data;
  const { issues, warnings } = mapRows(rows, mapping as Record<string, string>);

  let imported = 0;
  for (const issue of issues) {
    await createIssue(assessmentId, issue);
    imported++;
  }

  return NextResponse.json({ success: true, data: { imported, warnings } });
}
