'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import type { Assessment } from '@/lib/db/assessments';

interface AssessmentFormData {
  name: string;
  description: string;
  test_date_start: string;
  test_date_end: string;
  status: 'planning' | 'in_progress' | 'completed';
}

export default function EditAssessmentPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const assessmentId = params.assessmentId as string;
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/assessments/${assessmentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAssessment(json.data);
        else toast.error('Failed to load assessment');
      })
      .catch(() => toast.error('Failed to load assessment'))
      .finally(() => setFetching(false));
  }, [projectId, assessmentId]);

  const handleSubmit = async (data: AssessmentFormData) => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        status: data.status,
      };
      if (data.description !== undefined) payload.description = data.description;
      if (data.test_date_start)
        payload.test_date_start = new Date(data.test_date_start).toISOString();
      if (data.test_date_end) payload.test_date_end = new Date(data.test_date_end).toISOString();

      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Assessment updated');
      router.push(`/projects/${projectId}/assessments/${assessmentId}`);
    } catch {
      toast.error('Failed to update assessment');
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!assessment) {
    return <div className="p-6 text-destructive">Assessment not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${projectId}/assessments/${assessmentId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Assessment
      </Link>
      <h1 className="text-2xl font-bold">Edit Assessment</h1>
      <AssessmentForm assessment={assessment} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
