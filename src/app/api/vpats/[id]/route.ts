/**
 * VPAT API — /api/vpats/[id]
 *
 * GET    /api/vpats/[id]   Get a single VPAT with its criterion rows and issue counts
 * PUT    /api/vpats/[id]   Update a VPAT's metadata
 * DELETE /api/vpats/[id]   Delete a VPAT
 */

import { NextResponse } from 'next/server';
import { getVpat, updateVpat, deleteVpat } from '@/lib/db/vpats';
import { getCriterionRowsWithIssueCounts } from '@/lib/db/vpat-criterion-rows';
import { getSetting } from '@/lib/db/settings';
import { UpdateVpatSchema } from '@/lib/validators/vpats';

type RouteContext = { params: Promise<{ id: string }> };

async function resolveVpat(id: string) {
  const vpat = await getVpat(id);
  if (!vpat) {
    return {
      error: NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }
  return { vpat };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const resolved = await resolveVpat(id);
    if (resolved.error) return resolved.error;
    const locale = (getSetting('language') as string) ?? 'en';
    const rows = await getCriterionRowsWithIssueCounts(id, resolved.vpat.project_id, locale);
    return NextResponse.json({
      success: true,
      data: { ...resolved.vpat, criterion_rows: rows, locale },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const resolved = await resolveVpat(id);
    if (resolved.error) return resolved.error;

    const body = await request.json();
    const result = UpdateVpatSchema.safeParse(body);

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

    const updated = await updateVpat(id, result.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const resolved = await resolveVpat(id);
    if (resolved.error) return resolved.error;

    await deleteVpat(id);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
