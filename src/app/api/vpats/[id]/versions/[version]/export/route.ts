import { NextResponse } from 'next/server';
import { getVpat } from '@/lib/db/vpats';
import { getProject } from '@/lib/db/projects';
import { getVpatSnapshot } from '@/lib/db/vpat-snapshots';
import { generateVpatDocx } from '@/lib/export/vpat-docx';
import { generateOpenAcrYaml } from '@/lib/export/openacr';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';
import type { Vpat } from '@/lib/db/vpats';

type RouteContext = { params: Promise<{ id: string; version: string }> };

const SUPPORTED_FORMATS = ['docx', 'openacr'] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

function safeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id, version } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? '';

  if (!(SUPPORTED_FORMATS as readonly string[]).includes(format)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported format "${format}". Supported formats for snapshots: docx, openacr`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  const versionNum = parseInt(version, 10);
  if (isNaN(versionNum)) {
    return NextResponse.json(
      { success: false, error: 'Version must be a number', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  try {
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
    const project = await getProject(vpat.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Reconstruct a Vpat-shaped object from snapshot metadata
    const snapshotVpat: Vpat = {
      ...vpat,
      title: snapshot.data.title,
      description: snapshot.data.description,
      standard_edition: snapshot.data.standard_edition as Vpat['standard_edition'],
      wcag_version: snapshot.data.wcag_version as Vpat['wcag_version'],
      wcag_level: snapshot.data.wcag_level as Vpat['wcag_level'],
      product_scope: snapshot.data.product_scope,
      version_number: snapshot.version_number,
      published_at: snapshot.published_at,
      status: 'published',
    };

    // Reconstruct VpatCriterionRow[] from snapshot rows (fake IDs, AI fields null)
    const rows: VpatCriterionRow[] = snapshot.data.criterion_rows.map((r, i) => ({
      id: `snap-${i}`,
      vpat_id: id,
      criterion_id: `snap-${i}`,
      criterion_code: r.criterion_code,
      criterion_name: r.criterion_name,
      criterion_description: r.criterion_description,
      criterion_level: r.criterion_level,
      criterion_section: r.criterion_section,
      conformance: r.conformance as VpatCriterionRow['conformance'],
      remarks: r.remarks,
      ai_confidence: null,
      ai_reasoning: null,
      last_generated_at: null,
      updated_at: snapshot.published_at,
      issue_count: 0,
    }));

    const slug = safeTitle(snapshot.data.title);

    if ((format as SupportedFormat) === 'docx') {
      const buffer = await generateVpatDocx(snapshotVpat, project, rows);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="vpat-v${versionNum}-${slug}.docx"`,
        },
      });
    }

    // openacr
    const yaml = generateOpenAcrYaml(snapshotVpat, project, rows);
    return new Response(yaml, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml',
        'Content-Disposition': `attachment; filename="vpat-v${versionNum}-${slug}.yaml"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate export', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
