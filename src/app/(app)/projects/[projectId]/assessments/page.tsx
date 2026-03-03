import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { AssessmentCard } from '@/components/assessments/assessment-card';

export const dynamic = 'force-dynamic';

export default async function AssessmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();

  const assessments = getAssessments(projectId);

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${projectId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to project
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments — {project.name}</h1>
        <Button asChild>
          <Link href={`/projects/${projectId}/assessments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No assessments yet.</p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${projectId}/assessments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first assessment
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              projectName={project.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
