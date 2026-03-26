import Link from 'next/link';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { getIssuesByProject } from '@/lib/db/issues';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';
import { ProjectAssessmentsCard } from '@/components/assessments/project-assessments-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const assessments = await getAssessments(projectId);
  const issues = await getIssuesByProject(projectId);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity as keyof typeof severityCounts]++;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: project.name }]} />
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && <p className="mt-1 text-muted-foreground">{project.description}</p>}
        {project.product_url && (
          <a
            href={project.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            {project.product_url}
          </a>
        )}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Link
            href={`/projects/${project.id}/assessments/new`}
            className={buttonVariants({
              className: 'bg-success text-success-foreground hover:bg-success/90',
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Link>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <ProjectAssessmentsCard
            projectId={projectId}
            projectName={project.name}
            assessments={assessments}
          />
        </div>

        <aside className="w-72 shrink-0">
          <IssueStatistics statuses={['open']} projectId={projectId} />
        </aside>
      </div>
    </div>
  );
}
