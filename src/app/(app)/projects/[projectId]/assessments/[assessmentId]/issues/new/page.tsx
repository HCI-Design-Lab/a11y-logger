'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { IssueForm } from '@/components/issues/issue-form';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';

export default function NewIssuePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const assessmentId = params.assessmentId as string;
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
    <div className="space-y-6">
      <Link
        href={`/projects/${projectId}/assessments/${assessmentId}/issues`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Issues
      </Link>
      <h1 className="text-2xl font-bold">New Issue</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <IssueForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
