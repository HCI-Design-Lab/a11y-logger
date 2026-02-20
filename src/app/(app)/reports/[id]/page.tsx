export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, Pencil } from 'lucide-react';
import { getReport } from '@/lib/db/reports';
import type { ReportSection } from '@/lib/db/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteReportButton } from '@/components/reports/delete-report-button';
import { PublishReportButton } from '@/components/reports/publish-report-button';
import { getTypeBadgeClass, getStatusBadgeClass } from '@/components/reports/report-badge-utils';

type PageProps = { params: Promise<{ id: string }> };

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    notFound();
  }

  // content is stored as JSON: [{title, body}]
  // Filter out any entries missing required fields to avoid silent empty renders
  let sections: ReportSection[] = [];
  try {
    const raw = JSON.parse(report.content);
    sections = Array.isArray(raw)
      ? raw.filter(
          (s): s is ReportSection => typeof s?.title === 'string' && typeof s?.body === 'string'
        )
      : [];
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
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/api/reports/${report.id}/export?format=html`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export HTML
                </a>
              </Button>
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
