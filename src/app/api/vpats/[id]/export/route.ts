/**
 * VPAT Export API — /api/vpats/[id]/export
 *
 * GET /api/vpats/[id]/export   Export a VPAT as HTML, PDF, DOCX, or OpenACR YAML (format query param)
 */

import { NextResponse } from 'next/server';
import { getVpat } from '@/lib/db/vpats';
import { getProject } from '@/lib/db/projects';
import { getCriterionRows } from '@/lib/db/vpat-criterion-rows';
import { getCoverSheet } from '@/lib/db/vpat-cover-sheet';
import { generateVpatHtml } from '@/lib/export/vpat-template';
import { generateVpatDocx } from '@/lib/export/vpat-docx';
import { generateOpenAcrYaml } from '@/lib/export/openacr';

type RouteContext = { params: Promise<{ id: string }> };

const SUPPORTED_FORMATS = ['html', 'pdf', 'docx', 'openacr'] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

function safeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'html') as string;

  if (!(SUPPORTED_FORMATS as readonly string[]).includes(format)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported format "${format}". Supported formats: html, pdf, docx, openacr`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  // PDF requires Puppeteer which is not a production dependency
  if ((format as SupportedFormat) === 'pdf') {
    return NextResponse.json(
      {
        success: false,
        error:
          'PDF export requires Puppeteer which is not installed. ' +
          'Use HTML export (?format=html) and print to PDF from your browser using File > Print > Save as PDF.',
        code: 'NOT_IMPLEMENTED',
      },
      { status: 501 }
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

    const project = await getProject(vpat.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const rows = await getCriterionRows(id);
    const coverSheet = getCoverSheet(id);
    const slug = safeTitle(vpat.title);

    if ((format as SupportedFormat) === 'docx') {
      const buffer = await generateVpatDocx(vpat, project, rows, coverSheet);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="vpat-${slug}.docx"`,
        },
      });
    }

    if ((format as SupportedFormat) === 'openacr') {
      const yaml = generateOpenAcrYaml(vpat, project, rows, coverSheet);
      return new Response(yaml, {
        status: 200,
        headers: {
          'Content-Type': 'application/yaml',
          'Content-Disposition': `attachment; filename="vpat-${slug}.yaml"`,
        },
      });
    }

    // html (default)
    const html = generateVpatHtml(vpat, project, rows, coverSheet);
    const filename = `vpat-${slug}.html`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate export', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
