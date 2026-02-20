export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { getReport } from '@/lib/db/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteReportButton } from '@/components/reports/delete-report-button';
import { PublishReportButton } from '@/components/reports/publish-report-button';

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'executive':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'detailed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusBadgeClass(status: string): string {
  return status === 'published'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

type PageProps = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    notFound();
  }

  // content is stored as JSON: [{title, body}]
  let sections: { title: string; body: string }[] = [];
  try {
    sections = JSON.parse(report.content) as { title: string; body: string }[];
  } catch {
    sections = [];
  }

  const isPublished = report.status === 'published';

  return (
    <div>
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Reports
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {!isPublished && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${report.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
              <PublishReportButton reportId={report.id} isPublished={isPublished} />
              <DeleteReportButton reportId={report.id} reportTitle={report.title} />
            </div>
          </div>

          <Separator className="mb-6" />

          {sections.length === 0 ? (
            <p className="text-muted-foreground italic">
              No sections yet. Edit this report to add content.
            </p>
          ) : (
            <div className="space-y-8">
              {sections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Report Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge className={getTypeBadgeClass(report.type)} variant="outline">
                  {report.type}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusBadgeClass(report.status)} variant="outline">
                  {report.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sections</span>
                <span>{sections.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(report.updated_at).toLocaleDateString()}</span>
              </div>
              {report.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span>{new Date(report.published_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
