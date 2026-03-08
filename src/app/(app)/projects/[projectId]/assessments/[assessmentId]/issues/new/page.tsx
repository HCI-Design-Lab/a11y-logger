import { notFound } from 'next/navigation';
import { getProject } from '@/lib/db/projects';
import { getAssessment } from '@/lib/db/assessments';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { NewIssueClient } from './new-issue-client';

export const dynamic = 'force-dynamic';

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ projectId: string; assessmentId: string }>;
}) {
  const { projectId, assessmentId } = await params;

  const project = getProject(projectId);
  if (!project) notFound();

  const assessment = getAssessment(assessmentId);
  if (!assessment) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${projectId}` },
          { label: 'Assessments' },
          { label: assessment.name, href: `/projects/${projectId}/assessments/${assessmentId}` },
          { label: 'Issues', href: `/projects/${projectId}/assessments/${assessmentId}/issues` },
          { label: 'New Issue' },
        ]}
      />
      <NewIssueClient projectId={projectId} assessmentId={assessmentId} />
    </div>
  );
}
