/**
 * Project Issues API — /api/projects/[projectId]/issues
 *
 * GET /api/projects/[projectId]/issues   List all issues across all assessments for a project
 */

import { NextResponse } from 'next/server';
import { getIssuesByProject } from '@/lib/db/issues';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const issues = await getIssuesByProject(projectId);
  return NextResponse.json({ success: true, data: issues });
}
