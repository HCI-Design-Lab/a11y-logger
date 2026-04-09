/**
 * VPAT Row Generate API — /api/vpats/[id]/rows/[rowId]/generate
 *
 * POST /api/vpats/[id]/rows/[rowId]/generate   Generate AI narrative for a single VPAT criterion row
 */

import { NextResponse } from 'next/server';
import { getCriterionRow, updateCriterionRow } from '@/lib/db/vpat-criterion-rows';
import { getVpat } from '@/lib/db/vpats';
import { getDb } from '@/lib/db';
import { getSetting } from '@/lib/db/settings';
import { getAIProvider } from '@/lib/ai';

type RouteContext = { params: Promise<{ id: string; rowId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: vpatId, rowId } = await params;

  const ai = getAIProvider('vpat');
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'No AI provider configured', code: 'NO_AI_PROVIDER' },
      { status: 422 }
    );
  }

  const row = await getCriterionRow(rowId);
  if (!row || row.vpat_id !== vpatId)
    return NextResponse.json(
      { success: false, error: 'Row not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  const vpat = await getVpat(vpatId);
  if (!vpat)
    return NextResponse.json(
      { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
      { status: 404 }
    );

  const issues = getDb()
    .prepare(
      `
    SELECT i.id, i.assessment_id, i.title, i.severity, i.url, i.description
    FROM issues i
    JOIN assessments a ON i.assessment_id = a.id
    WHERE a.project_id = ?
      AND i.status = 'open'
      AND EXISTS (
        SELECT 1 FROM json_each(i.wcag_codes) WHERE value = ?
      )
  `
    )
    .all(vpat.project_id, row.criterion_code) as {
    id: string;
    assessment_id: string;
    title: string;
    severity: string;
    url: string;
    description: string;
  }[];

  const issueByTitle = new Map(issues.map((i) => [i.title, i]));

  const context = {
    criterion: {
      code: row.criterion_code,
      name: row.criterion_name,
      description: row.criterion_description,
    },
    issues,
  };

  try {
    let result = await ai.generateVpatRow(context);

    // Optional AI Review Pass — uses a separate model slot
    const reviewEnabled = getSetting('ai_review_pass_enabled');
    if (reviewEnabled) {
      const reviewer = getAIProvider('vpat_review');
      if (reviewer) {
        result = await reviewer.reviewVpatRow(context, result);
      }
    }

    const enrichedReferencedIssues = result.referenced_issues.map((ref) => {
      const match = issueByTitle.get(ref.title);
      if (match) {
        return {
          ...ref,
          id: match.id,
          assessment_id: match.assessment_id,
          project_id: vpat.project_id,
        };
      }
      return ref;
    });

    const updated = await updateCriterionRow(rowId, {
      remarks: result.remarks,
      ai_confidence: result.confidence,
      ai_reasoning: result.reasoning,
      ai_referenced_issues: enrichedReferencedIssues,
      ai_suggested_conformance: result.suggested_conformance,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'AI generation failed', code: 'AI_ERROR' },
      { status: 500 }
    );
  }
}
