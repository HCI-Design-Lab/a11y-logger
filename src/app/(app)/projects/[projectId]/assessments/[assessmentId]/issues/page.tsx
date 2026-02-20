import Link from 'next/link';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { SeverityBadge } from '@/components/issues/severity-badge';
import type { IssueFilters } from '@/lib/db/issues';

export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  wont_fix: { label: "Won't Fix", className: 'bg-gray-100 text-gray-700' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; assessmentId: string }>;
  searchParams: Promise<{ severity?: string }>;
}) {
  const { projectId, assessmentId } = await params;
  const { severity } = await searchParams;

  const project = getProject(projectId);
  if (!project) notFound();

  const assessment = getAssessment(assessmentId);
  if (!assessment) notFound();

  const filters: IssueFilters = {};
  if (severity && ['critical', 'high', 'medium', 'low'].includes(severity)) {
    filters.severity = severity as IssueFilters['severity'];
  }

  const issues = getIssues(assessmentId, filters);

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
        <Link
          href={`/projects/${projectId}/assessments/${assessmentId}`}
          className="hover:text-foreground"
        >
          {assessment.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Issues</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues — {assessment.name}</h1>
        <Button asChild>
          <Link href={`/projects/${projectId}/assessments/${assessmentId}/issues/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Issue
          </Link>
        </Button>
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filter by severity:</span>
        {(['', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={
              s
                ? `/projects/${projectId}/assessments/${assessmentId}/issues?severity=${s}`
                : `/projects/${projectId}/assessments/${assessmentId}/issues`
            }
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              (severity ?? '') === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </Link>
        ))}
      </div>

      {/* Issues table / empty state */}
      {issues.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No issues found.</p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${projectId}/assessments/${assessmentId}/issues/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first issue
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
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
                const statusConf = statusConfig[issue.status] ?? {
                  label: issue.status,
                  className: '',
                };
                return (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${projectId}/assessments/${assessmentId}/issues/${issue.id}`}
                        className="hover:underline"
                      >
                        {issue.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={issue.severity} />
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConf.className}>{statusConf.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(issue.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
