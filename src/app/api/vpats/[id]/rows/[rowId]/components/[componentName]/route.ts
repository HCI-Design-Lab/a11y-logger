/**
 * VPAT Criterion Component API — /api/vpats/[id]/rows/[rowId]/components/[componentName]
 *
 * PUT — Update conformance or remarks for a specific component of a criterion row.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCriterionRow,
  getCriterionComponent,
  upsertCriterionComponent,
} from '@/lib/db/vpat-criterion-rows';

const UpdateComponentSchema = z
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

type RouteContext = { params: Promise<{ id: string; rowId: string; componentName: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { id: vpatId, rowId, componentName } = await params;
  try {
    const body = await request.json();
    const result = UpdateComponentSchema.safeParse(body);
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
    const existing = await getCriterionComponent(rowId, componentName);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Component not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    const updated = await upsertCriterionComponent(rowId, componentName, result.data);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update component', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
