import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { getIssue } from '@/lib/db/issues';
import { SeverityBadge } from '@/components/issues/severity-badge';
import { DeleteIssueButton } from '@/components/issues/delete-issue-button';

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
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; assessmentId: string; issueId: string }>;
}) {
  const { projectId, assessmentId, issueId } = await params;

  const project = getProject(projectId);
  if (!project) notFound();

  const assessment = getAssessment(assessmentId);
  if (!assessment) notFound();

  const issue = getIssue(issueId);
  if (!issue) notFound();

  const statusConf = statusConfig[issue.status] ?? { label: issue.status, className: '' };

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
        <Link
          href={`/projects/${projectId}/assessments/${assessmentId}/issues`}
          className="hover:text-foreground"
        >
          Issues
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{issue.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{issue.title}</h1>
            <SeverityBadge severity={issue.severity} />
            <Badge className={statusConf.className}>{statusConf.label}</Badge>
          </div>
          {issue.url && (
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {issue.url}
            </a>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link
              href={`/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}/edit`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteIssueButton
            projectId={projectId}
            assessmentId={assessmentId}
            issueId={issueId}
            issueTitle={issue.title}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {issue.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
              </CardContent>
            </Card>
          )}

          {issue.wcag_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>WCAG Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {issue.wcag_codes.map((code) => (
                    <Badge key={code} variant="outline" className="font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {issue.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {issue.evidence_media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {issue.evidence_media.map((url, idx) => {
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                    return isVideo ? (
                      <video key={idx} src={url} controls className="rounded-md w-full" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        className="rounded-md w-full object-cover"
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Device', value: issue.device_type },
                { label: 'Browser', value: issue.browser },
                { label: 'OS', value: issue.operating_system },
                { label: 'Assistive Tech', value: issue.assistive_technology },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-muted-foreground">{label}</span>
                  <p className="font-medium">{value ?? '—'}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{formatDate(issue.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated</span>
                <p className="font-medium">{formatDate(issue.updated_at)}</p>
              </div>
              {issue.resolved_at && (
                <div>
                  <span className="text-muted-foreground">Resolved</span>
                  <p className="font-medium">{formatDate(issue.resolved_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
