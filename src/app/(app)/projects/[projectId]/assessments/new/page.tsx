'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import type { AssessmentFormData } from '@/lib/validators/assessments';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function NewAssessmentPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.name) {
          setProjectName(json.data.name);
        }
      })
      .catch(() => {
        router.push('/projects');
      });
  }, [projectId, router]);

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

      const res = await fetch(`/api/projects/${projectId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Assessment created');
      router.push(`/projects/${projectId}/assessments/${json.data.id}`);
    } catch {
      toast.error('Failed to create assessment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          ...(projectName !== null ? [{ label: projectName, href: `/projects/${projectId}` }] : []),
          { label: 'Assessments' },
          { label: 'New Assessment' },
        ]}
      />
      <h1 className="text-2xl font-bold">New Assessment</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <AssessmentForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
