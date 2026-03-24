import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';
import type { IssueFilters } from '@/lib/db/issues';
import { DeleteAssessmentButton } from '@/components/assessments/delete-assessment-button';
import { StatusTransitionButton } from '@/components/assessments/status-transition-button';
import { AssessmentIssuesCard } from '@/components/issues/assessment-issues-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export const dynamic = 'force-dynamic';

const statusConfig = {
  ready: { label: 'Ready', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; assessmentId: string }>;
  searchParams: Promise<{ severity?: string }>;
}) {
  const { projectId, assessmentId } = await params;
  const { severity } = await searchParams;

  const project = await getProject(projectId);
  if (!project) notFound();
  const assessment = await getAssessment(assessmentId);
  if (!assessment) notFound();

  const allIssues = await getIssues(assessmentId);

  const filters: IssueFilters = {};
  if (severity && (VALID_SEVERITIES as readonly string[]).includes(severity)) {
    filters.severity = severity as IssueFilters['severity'];
  }
  const filteredIssues = filters.severity ? await getIssues(assessmentId, filters) : allIssues;

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of allIssues) {
    severityCounts[issue.severity]++;
  }

  const status = statusConfig[assessment.status];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${projectId}` },
          { label: 'Assessments' },
          { label: assessment.name },
        ]}
      />

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
        <div className="flex-1">
          <AssessmentIssuesCard
            projectId={projectId}
            assessmentId={assessmentId}
            issues={filteredIssues}
            selectedSeverity={severity}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <IssueStatistics openTotal={allIssues.length} severityBreakdown={severityCounts} />
        </aside>
      </div>
    </div>
  );
}
