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
  // Prevent path traversal: only use basename of each segment
  const safeParts = pathSegments.map((p) => path.basename(p));
  const filePath = path.join(process.cwd(), 'data', 'media', ...safeParts);

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    return new NextResponse(file, { headers: { 'Content-Type': contentType } });
  } catch {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
}
