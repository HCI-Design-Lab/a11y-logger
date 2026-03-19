'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { IssueForm } from '@/components/issues/issue-form';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';

interface NewIssueClientProps {
  projectId: string;
  assessmentId: string;
}

export function NewIssueClient({ projectId, assessmentId }: NewIssueClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateIssueInput | UpdateIssueInput) => {
    setLoading(true);
    try {
      const payload = data as CreateIssueInput;
      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Issue created');
      router.push(`/projects/${projectId}/assessments/${assessmentId}/issues/${json.data.id}`);
    } catch {
      toast.error('Failed to create issue');
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">New Issue</h1>
      <IssueForm
        projectId={projectId}
        onSubmit={handleSubmit}
        loading={loading}
        cancelHref={`/projects/${projectId}/assessments/${assessmentId}`}
      />
    </>
  );
}
