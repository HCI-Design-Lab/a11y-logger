/**
 * VPAT Criterion Row API — /api/vpats/[id]/rows/[rowId]
 *
 * PATCH /api/vpats/[id]/rows/[rowId]   Update conformance status or remarks for a criterion row
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCriterionRow, getCriterionRow } from '@/lib/db/vpat-criterion-rows';

const UpdateRowSchema = z
  .object({
    conformance: z
      .enum([
        'supports',
        'partially_supports',
        'does_not_support',
        'not_applicable',
        'not_evaluated',
      ])
      .optional(),
    remarks: z.string().max(5000).optional(),
  })
  .refine(
    (d) => d.conformance !== undefined || d.remarks !== undefined,
    'At least one field must be provided'
  );

type RouteContext = { params: Promise<{ id: string; rowId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id: vpatId, rowId } = await params;
  try {
    const body = await request.json();
    const result = UpdateRowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message ?? 'Validation error',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }
    const row = await getCriterionRow(rowId);
    if (!row || row.vpat_id !== vpatId) {
      return NextResponse.json(
        { success: false, error: 'Row not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    const updated = await updateCriterionRow(rowId, result.data);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update row', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
