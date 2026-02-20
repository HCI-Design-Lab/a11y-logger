import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { getIssuesByProject } from '@/lib/db/issues';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const assessments = getAssessments(projectId);
  const issues = getIssuesByProject(projectId);

  const manifest = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    project_id: projectId,
  };

  const projectData = { project, assessments, issues };

  return new Promise<NextResponse>((resolve) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${project.name.replace(/["\r\n]/g, '_')}-export.zip"`,
          },
        })
      );
    });
    archive.on('error', (err: Error) => {
      resolve(
        NextResponse.json({ success: false, error: err.message }, { status: 500 })
      );
    });

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    archive.append(JSON.stringify(projectData, null, 2), { name: 'project.json' });
    archive.finalize();
  });
}
