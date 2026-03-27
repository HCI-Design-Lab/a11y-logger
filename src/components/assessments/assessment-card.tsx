import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentStatusBadge } from '@/components/assessments/assessment-status-badge';
import type { AssessmentWithCounts, AssessmentWithProject } from '@/lib/db/assessments';

interface AssessmentCardProps {
  assessment: AssessmentWithCounts | AssessmentWithProject;
  projectName?: string;
}

export function AssessmentCard({ assessment, projectName }: AssessmentCardProps) {
  const displayProjectName =
    'project_name' in assessment ? assessment.project_name : (projectName ?? null);
  return (
    <Link href={`/projects/${assessment.project_id}/assessments/${assessment.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{assessment.name}</CardTitle>
          {displayProjectName && (
            <p className="text-sm text-muted-foreground">{displayProjectName}</p>
          )}
          {assessment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{assessment.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <AssessmentStatusBadge status={assessment.status} />
          <span>
            {assessment.issue_count} issue{assessment.issue_count !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
