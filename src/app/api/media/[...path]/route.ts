import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// Map extensions to MIME types (no external dependency needed)
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;

  const MEDIA_ROOT = path.resolve(process.cwd(), 'data', 'media');
  const filePath = path.resolve(MEDIA_ROOT, ...pathSegments);

  // Guard against path traversal
  if (!filePath.startsWith(MEDIA_ROOT + path.sep)) {
    return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    return new NextResponse(file, { headers: { 'Content-Type': contentType } });
  } catch {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
}
