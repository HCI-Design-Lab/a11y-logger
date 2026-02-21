import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AssessmentWithCounts } from '@/lib/db/assessments';

interface AssessmentCardProps {
  assessment: AssessmentWithCounts;
  projectId: string;
}

const statusConfig = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function AssessmentCard({ assessment, projectId }: AssessmentCardProps) {
  const status = statusConfig[assessment.status];

  return (
    <Link href={`/projects/${projectId}/assessments/${assessment.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{assessment.name}</CardTitle>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          {assessment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{assessment.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex gap-4 text-sm text-muted-foreground">
          {(assessment.test_date_start || assessment.test_date_end) && (
            <span>
              {formatDate(assessment.test_date_start)}
              {assessment.test_date_end && ` – ${formatDate(assessment.test_date_end)}`}
            </span>
          )}
          <span>
            {assessment.issue_count} issue{assessment.issue_count !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
