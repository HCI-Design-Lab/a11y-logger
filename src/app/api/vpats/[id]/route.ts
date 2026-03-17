import { NextResponse } from 'next/server';
import { getVpat, updateVpat, deleteVpat } from '@/lib/db/vpats';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { UpdateVpatSchema } from '@/lib/validators/vpats';

type RouteContext = { params: Promise<{ id: string }> };

async function resolveVpat(id: string) {
  const vpat = getVpat(id);
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
    const rows = getCriterionRows(id);
    return NextResponse.json({ success: true, data: { ...resolved.vpat, criterion_rows: rows } });
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

    const updated = updateVpat(id, result.data);
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

    deleteVpat(id);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete VPAT', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
