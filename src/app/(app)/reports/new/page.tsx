export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getProjects } from '@/lib/db/projects';
import { getAssessments } from '@/lib/db/assessments';
import { ReportWizard } from '@/components/reports/report-wizard';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function NewReportPage() {
  const projects = getProjects().map((p) => ({ id: p.id, name: p.name }));
  const assessments = projects.flatMap((p) =>
    getAssessments(p.id).map((a) => ({
      id: a.id,
      project_id: a.project_id,
      name: a.name,
      status: a.status,
    }))
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'New Report' }]} />
      <h1 className="text-2xl font-bold mb-6">New Report</h1>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold mb-2">No projects found</h2>
          <p className="text-muted-foreground mb-4">
            You need at least one project before creating a report.
          </p>
          <Link href="/projects/new" className="text-primary hover:underline">
            Create a project
          </Link>
        </div>
      ) : (
        <ReportWizard projects={projects} assessments={assessments} />
      )}
    </div>
  );
}
