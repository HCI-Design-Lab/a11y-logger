'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import { IssueForm } from '@/components/issues/issue-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import type { Issue } from '@/lib/db/issues';
import type { UpdateIssueInput } from '@/lib/validators/issues';

const FORM_ID = 'edit-issue-form';

export default function EditIssuePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const assessmentId = params.assessmentId as string;
  const issueId = params.issueId as string;
  const router = useRouter();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [assessmentName, setAssessmentName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setIssue(json.data);
        else toast.error('Failed to load issue');
      })
      .catch(() => toast.error('Failed to load issue'))
      .finally(() => setFetching(false));
  }, [projectId, assessmentId, issueId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProjectName(json.data.name);
        else router.push('/projects');
      })
      .catch(() => router.push('/projects'));
  }, [projectId, router]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/assessments/${assessmentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAssessmentName(json.data.name);
        else router.push(`/projects/${projectId}/assessments`);
      })
      .catch(() => router.push(`/projects/${projectId}/assessments`));
  }, [projectId, assessmentId, router]);

  const handleSubmit = async (data: UpdateIssueInput) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Issue updated');
      router.push(`/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`);
    } catch {
      toast.error('Failed to update issue');
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!issue) {
    return <div className="p-6 text-destructive">Issue not found.</div>;
  }

  const cancelHref = `/projects/${projectId}/assessments/${assessmentId}/issues/${issueId}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          ...(projectName !== null ? [{ label: projectName, href: `/projects/${projectId}` }] : []),
          { label: 'Assessments' },
          ...(assessmentName !== null
            ? [
                {
                  label: assessmentName,
                  href: `/projects/${projectId}/assessments/${assessmentId}`,
                },
              ]
            : []),
          { label: 'Issues' },
          {
            label: issue.title,
            href: cancelHref,
          },
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-2xl font-bold">Edit Issue</h1>
      <IssueForm
        projectId={projectId}
        issue={issue}
        onSubmit={handleSubmit}
        loading={loading}
        externalButtons={FORM_ID}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" form={FORM_ID} disabled={loading}>
          <Save className="h-4 w-4" />
          Save Issue
        </Button>
        <Button variant="cancel" asChild>
          <Link href={cancelHref}>
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}
