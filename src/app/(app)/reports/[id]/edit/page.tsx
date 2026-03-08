export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
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
      <h1 className="text-2xl font-bold mb-6">Edit Report</h1>

      <ReportForm report={report} />
    </div>
  );
}
