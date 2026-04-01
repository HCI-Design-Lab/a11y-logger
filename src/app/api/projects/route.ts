/**
 * Projects API — /api/projects
 *
 * GET  /api/projects   List all projects
 * POST /api/projects   Create a new project
 */

import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db/projects';
import { CreateProjectSchema } from '@/lib/validators/projects';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const project = await createProject(result.data);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create project', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
