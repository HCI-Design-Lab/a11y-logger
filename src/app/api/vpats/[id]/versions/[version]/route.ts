import { NextResponse } from 'next/server';
import { getVpat } from '@/lib/db/vpats';
import { getVpatSnapshot } from '@/lib/db/vpat-snapshots';

type RouteContext = { params: Promise<{ id: string; version: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id, version } = await params;
  const versionNum = parseInt(version, 10);
  if (isNaN(versionNum)) {
    return NextResponse.json(
      { success: false, error: 'Version must be a number', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
  const vpat = await getVpat(id);
  if (!vpat) {
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  const snapshot = await getVpatSnapshot(id, versionNum);
  if (!snapshot) {
    return NextResponse.json(
      { success: false, error: 'Version not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      version_number: snapshot.version_number,
      published_at: snapshot.published_at,
      vpat: snapshot.data,
    },
  });
}
