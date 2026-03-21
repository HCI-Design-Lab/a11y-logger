import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';

export async function POST(request: Request) {
  const ai = getAIProvider();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'AI not configured', code: 'AI_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { projectId, criterionCode } = body as Record<string, unknown>;

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return NextResponse.json(
      { success: false, error: 'projectId is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }
  if (typeof criterionCode !== 'string' || !criterionCode.trim()) {
    return NextResponse.json(
      { success: false, error: 'criterionCode is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Gather issues for the project matching the criterion code
  const assessments = await getAssessments(projectId);
  const matchingIssues = (
    await Promise.all(assessments.map((a) => getIssues(a.id, { wcag_code: criterionCode })))
  ).flat();

  const issueSummary =
    matchingIssues.length > 0
      ? `Issues related to criterion ${criterionCode}:\n${matchingIssues
          .map(
            (i) =>
              `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description ?? 'No description'}`
          )
          .join('\n')}`
      : `No specific issues found for criterion ${criterionCode} in project "${project.name}".`;

  try {
    const narrative = await ai.generateVpatRemarks(issueSummary, criterionCode);
    return NextResponse.json({
      success: true,
      data: { narrative },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    return NextResponse.json({ success: false, error: message, code: 'AI_ERROR' }, { status: 500 });
  }
}
