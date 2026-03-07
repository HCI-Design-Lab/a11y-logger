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
import { StatusBadge } from '@/components/issues/status-badge';
import { DeleteIssueButton } from '@/components/issues/delete-issue-button';

export const dynamic = 'force-dynamic';

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
            <StatusBadge status={issue.status} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: all text fields in one card */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="divide-y pt-6">
              {issue.description && (
                <div className="pb-6">
                  <h2 className="text-sm font-semibold mb-2">Description</h2>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {issue.description}
                  </p>
                </div>
              )}

              {issue.user_impact && (
                <div className="py-6">
                  <h2 className="text-sm font-semibold mb-2">User Impact</h2>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {issue.user_impact}
                  </p>
                </div>
              )}

              {issue.suggested_fix && (
                <div className="py-6">
                  <h2 className="text-sm font-semibold mb-2">Suggested Fix</h2>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {issue.suggested_fix}
                  </p>
                </div>
              )}

              {(issue.selector || issue.code_snippet) && (
                <div className="py-6 space-y-4">
                  <h2 className="text-sm font-semibold">Technical Details</h2>
                  {issue.selector && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Selector</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded block break-all">
                        {issue.selector}
                      </code>
                    </div>
                  )}
                  {issue.code_snippet && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Code Snippet</p>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {issue.code_snippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {issue.wcag_codes.length > 0 && (
                <div className="py-6">
                  <h2 className="text-sm font-semibold mb-2">WCAG Criteria</h2>
                  <div className="flex flex-wrap gap-2">
                    {issue.wcag_codes.map((code) => (
                      <Badge key={code} variant="outline" className="font-mono">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {issue.tags.length > 0 && (
                <div className="py-6">
                  <h2 className="text-sm font-semibold mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {issue.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-6">
                <h2 className="text-sm font-semibold mb-3">Environment</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Device', value: issue.device_type },
                    { label: 'Browser', value: issue.browser },
                    { label: 'OS', value: issue.operating_system },
                    { label: 'Assistive Tech', value: issue.assistive_technology },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="pt-6">
                <h2 className="text-sm font-semibold mb-3">Dates</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">{formatDate(issue.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="font-medium">{formatDate(issue.updated_at)}</dd>
                  </div>
                  {issue.resolved_at && (
                    <div>
                      <dt className="text-muted-foreground">Resolved</dt>
                      <dd className="font-medium">{formatDate(issue.resolved_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: attachments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.evidence_media.length > 0 ? (
                <div className="grid gap-3 grid-cols-2">
                  {issue.evidence_media.map((url) => {
                    const fileName = url.split('/').pop() ?? url;
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                    return isVideo ? (
                      <video
                        key={url}
                        src={url}
                        controls
                        aria-label={fileName}
                        className="rounded-md w-full"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={fileName}
                        className="rounded-md w-full object-cover"
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
