'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type { AssessmentFormData } from '@/components/assessments/assessment-form';
import type { Assessment } from '@/lib/db/assessments';

export default function EditAssessmentPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const assessmentId = params.assessmentId as string;
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/assessments/${assessmentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setAssessment(json.data);
        } else {
          toast.error('Failed to load assessment');
          router.push(`/projects/${projectId}/assessments`);
        }
      })
      .catch(() => {
        toast.error('Failed to load assessment');
        router.push(`/projects/${projectId}/assessments`);
      })
      .finally(() => setFetching(false));
  }, [projectId, assessmentId]);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const list: { id: string; name: string }[] = json.data.map(
            (p: { id: string; name: string }) => ({ id: p.id, name: p.name })
          );
          setProjects(list);
          const match = list.find((p) => p.id === projectId);
          if (match) setProjectName(match.name);
        }
      })
      .catch(() => {}); // non-critical, form still works without projects
  }, [projectId]);

  const handleSubmit = async (data: AssessmentFormData) => {
    setLoading(true);
    try {
      const newProjectId = data.project_id ?? projectId;
      const payload: Record<string, unknown> = {
        name: data.name,
        status: data.status,
      };
      if (data.description !== undefined) payload.description = data.description;
      if (data.test_date_start)
        payload.test_date_start = new Date(data.test_date_start).toISOString();
      if (data.test_date_end) payload.test_date_end = new Date(data.test_date_end).toISOString();
      if (data.project_id && data.project_id !== projectId) {
        payload.project_id = data.project_id;
      }

      const res = await fetch(`/api/projects/${projectId}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Assessment updated');
      router.push(`/projects/${newProjectId}/assessments/${assessmentId}`);
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
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          ...(projectName !== null ? [{ label: projectName, href: `/projects/${projectId}` }] : []),
          { label: 'Assessments' },
          { label: assessment.name, href: `/projects/${projectId}/assessments/${assessmentId}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-2xl font-bold">Edit Assessment</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <AssessmentForm
            assessment={assessment}
            onSubmit={handleSubmit}
            loading={loading}
            projects={projects}
            defaultProjectId={assessment.project_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
