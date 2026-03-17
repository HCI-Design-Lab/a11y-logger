import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCriterionRow } from '@/lib/db/vpat-criterion-rows';

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
    remarks: z.string().max(5000).nullable().optional(),
  })
  .refine(
    (d) => d.conformance !== undefined || d.remarks !== undefined,
    'At least one field must be provided'
  );

type RouteContext = { params: Promise<{ id: string; rowId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { rowId } = await params;
  try {
    const body = await request.json();
    const result = UpdateRowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    const updated = updateCriterionRow(rowId, result.data);
    if (!updated)
      return NextResponse.json(
        { success: false, error: 'Row not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update row', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
