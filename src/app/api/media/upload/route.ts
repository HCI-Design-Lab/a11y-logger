import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string | null;
  const issueId = formData.get('issueId') as string | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'File type not allowed' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: 'File too large. Maximum size is 10MB' },
      { status: 400 }
    );
  }

  if (!projectId || !issueId) {
    return NextResponse.json(
      { success: false, error: 'projectId and issueId are required' },
      { status: 400 }
    );
  }

  // Sanitize: take only basename, replace unsafe chars
  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');

  const MEDIA_ROOT = path.resolve(process.cwd(), 'data', 'media');
  const dir = path.resolve(MEDIA_ROOT, projectId, issueId);

  // Guard against path traversal via projectId or issueId
  if (!dir.startsWith(MEDIA_ROOT + path.sep)) {
    return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
  }

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    success: true,
    data: { url: `/api/media/${projectId}/${issueId}/${safeName}` },
  });
}
