'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import type { AssessmentFormData } from '@/components/assessments/assessment-form';

interface Props {
  projects: { id: string; name: string }[];
}

export default function NewAssessmentClient({ projects }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AssessmentFormData) => {
    if (!data.project_id) {
      toast.error('Please select a project');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name: data.name, status: data.status };
      if (data.description) payload.description = data.description;
      if (data.test_date_start)
        payload.test_date_start = new Date(data.test_date_start).toISOString();
      if (data.test_date_end) payload.test_date_end = new Date(data.test_date_end).toISOString();

      const res = await fetch(`/api/projects/${data.project_id}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Assessment created');
      router.push(`/projects/${data.project_id}/assessments/${json.data.id}`);
    } catch {
      toast.error('Failed to create assessment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Assessments', href: '/assessments' }, { label: 'New Assessment' }]}
      />
      <h1 className="text-2xl font-bold">New Assessment</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <AssessmentForm onSubmit={handleSubmit} loading={loading} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
