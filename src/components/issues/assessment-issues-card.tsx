import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IssuesTable } from '@/components/issues/issues-table';
import type { Issue } from '@/lib/db/issues';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

interface AssessmentIssuesCardProps {
  projectId: string;
  assessmentId: string;
  issues: Issue[];
  selectedSeverity?: string;
}

export function AssessmentIssuesCard({
  projectId,
  assessmentId,
  issues,
  selectedSeverity,
}: AssessmentIssuesCardProps) {
  const baseUrl = `/projects/${projectId}/assessments/${assessmentId}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Issues ({issues.length})</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            {(['', ...SEVERITIES] as const).map((s) => (
              <Link
                key={s || 'all'}
                href={s ? `${baseUrl}?severity=${s}` : baseUrl}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  (selectedSeverity ?? '') === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </Link>
            ))}
          </div>
          <Button asChild size="sm">
            <Link href={`${baseUrl}/issues/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Issue
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issues yet.</p>
        ) : (
          <IssuesTable issues={issues} projectId={projectId} assessmentId={assessmentId} />
        )}
      </CardContent>
    </Card>
  );
}
