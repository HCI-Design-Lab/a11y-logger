import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssessmentWithCounts, AssessmentWithProject } from '@/lib/db/assessments';

const statusConfig = {
  ready: { label: 'Ready', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

interface AssessmentCardProps {
  assessment: AssessmentWithCounts | AssessmentWithProject;
  projectName?: string;
}

export function AssessmentCard({ assessment, projectName }: AssessmentCardProps) {
  const s = statusConfig[assessment.status];
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
          <Badge className={s.className}>{s.label}</Badge>
          <span>
            {assessment.issue_count} issue{assessment.issue_count !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
