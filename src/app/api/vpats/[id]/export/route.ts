import { NextResponse } from 'next/server';
import { getVpat } from '@/lib/db/vpats';
import { getProject } from '@/lib/db/projects';
import { generateVpatHtml } from '@/lib/export/vpat-template';
import { generateVpatDocx } from '@/lib/export/vpat-docx';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'html') as string;

  // Validate format
  if (format !== 'html' && format !== 'pdf' && format !== 'docx') {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported format "${format}". Supported formats: html, pdf, docx`,
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  if (format === 'pdf') {
    try {
      const vpat = getVpat(id);
      if (!vpat) {
        return NextResponse.json(
          { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const project = getProject(vpat.project_id);
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const html = generateVpatHtml(vpat, project, { autoPrint: true });
      const safeTitle = vpat.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
      const filename = `vpat-${safeTitle}.html`;

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

  if (format === 'docx') {
    try {
      const vpat = getVpat(id);
      if (!vpat) {
        return NextResponse.json(
          { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const project = getProject(vpat.project_id);
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const buffer = await generateVpatDocx(vpat, project);
      const safeTitle = vpat.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
      const filename = `vpat-${safeTitle}.docx`;

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

  try {
    const vpat = getVpat(id);
    if (!vpat) {
      return NextResponse.json(
        { success: false, error: 'VPAT not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const project = getProject(vpat.project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const html = generateVpatHtml(vpat, project);

    // Sanitize title for use in filename
    const safeTitle = vpat.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    const filename = `vpat-${safeTitle}.html`;

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
