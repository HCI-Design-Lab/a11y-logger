import Link from 'next/link';
import { ChevronLeft, Download, ExternalLink, Pencil, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProject } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { getIssuesByProject } from '@/lib/db/issues';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';
import { AssessmentsTable } from '@/components/assessments/assessments-table';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();

  const assessments = getAssessments(projectId);
  const issues = getIssuesByProject(projectId);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity as keyof typeof severityCounts]++;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/projects/${project.id}/export`} download>
              <Download className="mr-2 h-4 w-4" />
              Export ZIP
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/projects/${project.id}/export/csv`} download>
              Export CSV
            </a>
          </Button>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assessments</CardTitle>
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/assessments/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Assessment
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AssessmentsTable assessments={assessments} projectId={projectId} />
            </CardContent>
          </Card>
        </div>

        <aside className="w-72 shrink-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Issue Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'critical', label: 'Critical', color: 'text-red-400' },
                { key: 'high', label: 'High', color: 'text-orange-400' },
                { key: 'medium', label: 'Medium', color: 'text-yellow-400' },
                { key: 'low', label: 'Low', color: 'text-blue-400' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className={`font-medium ${color}`}>{label}</span>
                  <span className="font-bold">
                    {severityCounts[key as keyof typeof severityCounts]}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{issues.length}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
