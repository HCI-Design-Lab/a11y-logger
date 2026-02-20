import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/db/projects';
import { getIssuesByProject } from '@/lib/db/issues';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const issues = getIssuesByProject(projectId);
  const headers = ['id', 'title', 'severity', 'status', 'wcag_codes', 'tags', 'created_at'];

  const csvRows = [
    headers.join(','),
    ...issues.map((issue) =>
      [
        issue.id,
        `"${(issue.title ?? '').replace(/"/g, '""')}"`,
        issue.severity,
        issue.status,
        `"${JSON.stringify(issue.wcag_codes ?? []).replace(/"/g, '""')}"`,
        `"${JSON.stringify(issue.tags ?? []).replace(/"/g, '""')}"`,
        issue.created_at,
      ].join(',')
    ),
  ];

  const csv = csvRows.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${project.name}-issues.csv"`,
    },
  });
}
