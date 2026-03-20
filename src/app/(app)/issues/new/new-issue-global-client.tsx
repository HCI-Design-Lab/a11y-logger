'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { IssueForm } from '@/components/issues/issue-form';
import type { CreateIssueInput, UpdateIssueInput } from '@/lib/validators/issues';
import type { AssessmentWithProject } from '@/lib/db/assessments';

interface NewIssueGlobalClientProps {
  assessments: AssessmentWithProject[];
}

export function NewIssueGlobalClient({ assessments }: NewIssueGlobalClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const assessmentOptions = assessments.map((a) => ({
    id: a.id,
    name: a.name,
    projectId: a.project_id,
    projectName: a.project_name,
  }));

  const handleAssessmentChange = (assessmentId: string, projectId: string) => {
    setSelectedAssessmentId(assessmentId);
    setSelectedProjectId(projectId);
  };

  const handleSubmit = async (data: CreateIssueInput | UpdateIssueInput) => {
    if (!selectedAssessmentId || !selectedProjectId) {
      toast.error('Please select an assessment first.');
      return;
    }

    setLoading(true);
    try {
      const payload = data as CreateIssueInput;
      const res = await fetch(
        `/api/projects/${selectedProjectId}/assessments/${selectedAssessmentId}/issues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Issue created');
      router.push(
        `/projects/${selectedProjectId}/assessments/${selectedAssessmentId}/issues/${json.data.id}`
      );
    } catch {
      toast.error('Failed to create issue');
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">New Issue</h1>
      <IssueForm
        projectId={selectedProjectId ?? ''}
        assessmentOptions={assessmentOptions}
        onAssessmentChange={handleAssessmentChange}
        onSubmit={handleSubmit}
        loading={loading}
        cancelHref="/issues"
      />
    </>
  );
}
