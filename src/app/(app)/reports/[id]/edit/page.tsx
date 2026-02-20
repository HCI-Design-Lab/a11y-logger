export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getReport } from '@/lib/db/reports';
import { ReportForm } from '@/components/reports/report-form';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    notFound();
  }

  if (report.status === 'published') {
    notFound();
  }

  return (
    <div>
      <Link
        href={`/reports/${id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Report
      </Link>

      <h1 className="text-2xl font-bold mb-6">Edit Report</h1>

      <ReportForm report={report} projects={[]} />
    </div>
  );
}
