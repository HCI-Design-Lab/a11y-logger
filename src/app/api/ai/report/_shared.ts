import { getReport, getReportIssues } from '@/lib/db/reports';
import { getAssessment } from '@/lib/db/assessments';
import { getProject } from '@/lib/db/projects';
import type { Issue } from '@/lib/db/issues';

export function buildIssueContext(reportId: string): {
  report: { id: string; title: string } | null;
  context: string;
} {
  const report = getReport(reportId);
  if (!report) return { report: null, context: '' };

  const issues: Issue[] = getReportIssues(reportId);

  // Derive project from first linked assessment
  let projectName = '';
  let projectDescription = '';
  const firstId = report.assessment_ids[0];
  if (firstId) {
    const assessment = getAssessment(firstId);
    if (assessment) {
      const project = getProject(assessment.project_id);
      if (project) {
        projectName = project.name;
        projectDescription = project.description ?? '';
      }
    }
  }

  const context = [
    projectName ? `Project: ${projectName}` : '',
    projectDescription ? `Description: ${projectDescription}` : '',
    `Report: ${report.title}`,
    `Total issues: ${issues.length}`,
    issues.length > 0
      ? `Issues:\n${issues
          .map(
            (i) =>
              `- [${i.severity.toUpperCase()}] ${i.title}` +
              (Array.isArray(i.wcag_codes) && i.wcag_codes.length
                ? ` (WCAG: ${i.wcag_codes.join(', ')})`
                : '')
          )
          .join('\n')}`
      : 'No issues found.',
  ]
    .filter(Boolean)
    .join('\n');

  return { report, context };
}
