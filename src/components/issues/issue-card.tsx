import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from '@/components/issues/severity-badge';
import { StatusBadge } from '@/components/issues/status-badge';
import type { IssueWithContext } from '@/lib/db/issues';

interface IssueCardProps {
  issue: IssueWithContext;
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link
      href={`/projects/${issue.project_id}/assessments/${issue.assessment_id}/issues/${issue.id}`}
    >
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{issue.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            <span>{issue.project_name}</span>
            <span aria-hidden="true"> · </span>
            <span>{issue.assessment_name}</span>
          </p>
          {issue.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <SeverityBadge severity={issue.severity} />
          <StatusBadge status={issue.status} />
        </CardContent>
      </Card>
    </Link>
  );
}
