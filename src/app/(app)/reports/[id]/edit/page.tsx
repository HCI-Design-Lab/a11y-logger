export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getReport } from '@/lib/db/reports';
import { ReportForm } from '@/components/reports/report-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

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
      <Breadcrumbs
        items={[
          { label: 'Reports', href: '/reports' },
          { label: report.title, href: `/reports/${id}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">Edit Report</h1>

      <ReportForm report={report} />
    </div>
  );
}
