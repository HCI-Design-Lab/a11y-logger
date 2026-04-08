/**
 * Cover Sheet API — /api/vpats/[id]/cover-sheet
 *
 * GET  /api/vpats/[id]/cover-sheet   Fetch cover sheet for a VPAT (null if not yet created)
 * PUT  /api/vpats/[id]/cover-sheet   Create or update cover sheet fields
 */

import { NextResponse } from 'next/server';
import { getCoverSheet, upsertCoverSheet } from '@/lib/db/vpat-cover-sheet';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const coverSheet = getCoverSheet(id);
    return NextResponse.json({ success: true, data: coverSheet });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover sheet', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();
    const coverSheet = upsertCoverSheet(id, body);
    return NextResponse.json({ success: true, data: coverSheet });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save cover sheet', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
