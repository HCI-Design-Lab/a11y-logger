import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';
import { DeleteAssessmentButton } from '@/components/assessments/delete-assessment-button';
import { StatusTransitionButton } from '@/components/assessments/status-transition-button';
import { IssuesTable } from '@/components/issues/issues-table';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

export const dynamic = 'force-dynamic';

const statusConfig = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; assessmentId: string }>;
}) {
  const { projectId, assessmentId } = await params;

  const project = getProject(projectId);
  if (!project) notFound();
  const assessment = getAssessment(assessmentId);
  if (!assessment) notFound();

  const issues = getIssues(assessmentId);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity]++;
  }

  const status = statusConfig[assessment.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground">
          Projects
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-foreground">
          {project.name}
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}/assessments`} className="hover:text-foreground">
          Assessments
        </Link>
        <span>/</span>
        <span className="text-foreground">{assessment.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{assessment.name}</h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          {assessment.description && (
            <p className="text-muted-foreground">{assessment.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatDate(assessment.test_date_start)} — {formatDate(assessment.test_date_end)}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusTransitionButton
            projectId={projectId}
            assessmentId={assessmentId}
            currentStatus={assessment.status}
          />
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/assessments/${assessmentId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteAssessmentButton
            projectId={projectId}
            assessmentId={assessmentId}
            assessmentName={assessment.name}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Issues table */}
        <div className="flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issues ({issues.length})</CardTitle>
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/assessments/${assessmentId}/issues/new`}>
                  Add Issue
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <IssuesTable issues={issues} projectId={projectId} assessmentId={assessmentId} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <IssueStatistics total={issues.length} severityBreakdown={severityCounts} />
        </aside>
      </div>
    </div>
  );
}
