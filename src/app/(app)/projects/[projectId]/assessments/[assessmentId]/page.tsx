import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssues } from '@/lib/db/issues';
import { DeleteAssessmentButton } from '@/components/assessments/delete-assessment-button';
import { StatusTransitionButton } from '@/components/assessments/status-transition-button';

export const dynamic = 'force-dynamic';

const statusConfig = {
  planning: { label: 'Planning', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

const severityConfig = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-blue-100 text-blue-700' },
};

const issueStatusLabels: Record<string, string> = {
  open: 'Open',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
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
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No issues yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => {
                      const sev = severityConfig[issue.severity];
                      return (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium">{issue.title}</TableCell>
                          <TableCell>
                            <Badge className={sev.className}>{sev.label}</Badge>
                          </TableCell>
                          <TableCell>{issueStatusLabels[issue.status] ?? issue.status}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(issue.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Severity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'critical', label: 'Critical', color: 'text-red-500' },
                { key: 'high', label: 'High', color: 'text-orange-500' },
                { key: 'medium', label: 'Medium', color: 'text-yellow-500' },
                { key: 'low', label: 'Low', color: 'text-blue-500' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className={`font-medium ${color}`}>{label}</span>
                  <span className="font-bold">
                    {severityCounts[key as keyof typeof severityCounts]}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{issues.length}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
