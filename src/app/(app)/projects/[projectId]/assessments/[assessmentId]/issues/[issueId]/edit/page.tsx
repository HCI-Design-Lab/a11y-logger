'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IssueForm } from '@/components/issues/issue-form';
import type { Issue } from '@/lib/db/issues';
import type { UpdateIssueInput } from '@/lib/validators/issues';

export default function EditIssuePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const assessmentId = params.assessmentId as string;
  const issueId = params.issueId as string;
  const router = useRouter();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Issue</h1>
      <IssueForm projectId={projectId} issue={issue} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
