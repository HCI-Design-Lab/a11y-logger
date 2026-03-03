import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IssueWithContext } from '@/lib/db/issues';

const severityConfig = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-blue-100 text-blue-700' },
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

interface IssueCardProps {
  issue: IssueWithContext;
}

export function IssueCard({ issue }: IssueCardProps) {
  const sev = severityConfig[issue.severity];
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
          <Badge className={sev.className}>{sev.label}</Badge>
          <Badge variant="outline">{statusLabels[issue.status] ?? issue.status}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
