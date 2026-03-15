'use client';
import { ExternalLink } from 'lucide-react';
import { SeverityBadge } from '@/components/issues/severity-badge';

interface IssueItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string | null;
  project_id: string;
  assessment_id: string;
}

interface Props {
  issues: IssueItem[];
  criterionCode: string;
}

export function VpatIssuesPanel({ issues, criterionCode }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Issues linked to {criterionCode}
      </p>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues linked to this criterion.</p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="space-y-1 pb-3 border-b last:border-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{issue.title}</p>
                <SeverityBadge severity={issue.severity} />
              </div>
              {issue.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
              )}
              <a
                href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open Issue
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
