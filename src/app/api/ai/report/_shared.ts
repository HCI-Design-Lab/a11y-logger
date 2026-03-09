import { getReport, getReportIssues } from '@/lib/db/reports';
import type { Issue } from '@/lib/db/issues';

export function buildIssueContext(reportId: string): {
  report: { id: string; title: string } | null;
  context: string;
} {
  const report = getReport(reportId);
  if (!report) return { report: null, context: '' };

  const issues: Issue[] = getReportIssues(reportId);
  const context = [
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
  ].join('\n');

  return { report, context };
}
