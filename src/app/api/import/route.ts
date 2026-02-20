import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createProject, getProjects } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue } from '@/lib/db/issues';
import type { Project } from '@/lib/db/projects';
import type { Assessment } from '@/lib/db/assessments';
import type { Issue } from '@/lib/db/issues';

interface ProjectExportData {
  project: Project;
  assessments: Assessment[];
  issues: Issue[];
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    // Validate manifest
    if (!zip.files['manifest.json']) {
      return NextResponse.json(
        { success: false, error: 'Invalid export: missing manifest.json' },
        { status: 400 }
      );
    }

    // Validate project data
    if (!zip.files['project.json']) {
      return NextResponse.json(
        { success: false, error: 'Invalid export: missing project.json' },
        { status: 400 }
      );
    }

    const projectText = await zip.files['project.json']!.async('text');
    const exportData: ProjectExportData = JSON.parse(projectText);

    const { project: originalProject, assessments, issues } = exportData;

    // Handle duplicate project names
    const existingProjects = getProjects();
    const existingNames = new Set(existingProjects.map((p) => p.name));
    let projectName = originalProject.name;
    if (existingNames.has(projectName)) {
      projectName = `${projectName} (imported)`;
    }

    // Create the new project
    const newProject = createProject({
      name: projectName,
      description: originalProject.description ?? undefined,
      product_url: originalProject.product_url ?? undefined,
      status: originalProject.status,
    });

    // Map old assessment IDs to new ones
    const assessmentIdMap = new Map<string, string>();

    for (const assessment of assessments) {
      const newAssessment = createAssessment(newProject.id, {
        name: assessment.name,
        description: assessment.description ?? undefined,
        test_date_start: assessment.test_date_start ?? undefined,
        test_date_end: assessment.test_date_end ?? undefined,
        status: assessment.status,
        assigned_to: assessment.assigned_to ?? undefined,
      });
      assessmentIdMap.set(assessment.id, newAssessment.id);
    }

    // Import issues linked to new assessment IDs
    for (const issue of issues) {
      const newAssessmentId = assessmentIdMap.get(issue.assessment_id);
      if (!newAssessmentId) continue;

      createIssue(newAssessmentId, {
        title: issue.title,
        description: issue.description ?? undefined,
        url: issue.url ?? undefined,
        severity: issue.severity,
        status: issue.status,
        wcag_codes: issue.wcag_codes,
        device_type: issue.device_type ?? undefined,
        browser: issue.browser ?? undefined,
        operating_system: issue.operating_system ?? undefined,
        assistive_technology: issue.assistive_technology ?? undefined,
        evidence_media: issue.evidence_media,
        tags: issue.tags,
      });
    }

    return NextResponse.json({ success: true, data: { projectId: newProject.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
