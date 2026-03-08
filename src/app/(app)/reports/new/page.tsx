export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getProjects } from '@/lib/db/projects';
import { ReportForm } from '@/components/reports/report-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function NewReportPage() {
  const projects = getProjects().map((p) => ({ id: p.id, name: p.name }));

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
        <ReportForm projects={projects} />
      )}
    </div>
  );
}
