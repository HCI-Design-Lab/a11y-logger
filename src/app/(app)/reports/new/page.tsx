export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getProjects } from '@/lib/db/projects';
import { ReportForm } from '@/components/reports/report-form';

export default function NewReportPage() {
  const projects = getProjects().map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <Link
        href="/reports"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Reports
      </Link>

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
