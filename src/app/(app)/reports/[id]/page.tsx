export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Pencil } from 'lucide-react';
import { getReport } from '@/lib/db/reports';
import type { ReportContent } from '@/lib/validators/reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteReportButton } from '@/components/reports/delete-report-button';
import { PublishReportButton } from '@/components/reports/publish-report-button';
import { getTypeBadgeClass, getStatusBadgeClass } from '@/components/reports/report-badge-utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

type PageProps = { params: Promise<{ id: string }> };

const USER_IMPACT_LABELS: Record<string, string> = {
  screen_reader: 'Screen Reader',
  low_vision: 'Low Vision',
  color_vision: 'Color Vision',
  keyboard_only: 'Keyboard Only',
  cognitive: 'Cognitive',
  deaf_hard_of_hearing: 'Deaf / Hard of Hearing',
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    notFound();
  }

  // Parse content as ReportContent object
  let content: ReportContent = {};
  try {
    const raw = JSON.parse(report.content);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      content = raw as ReportContent;
    }
  } catch {
    content = {};
  }

  const hasContent = Object.keys(content).length > 0;
  const isPublished = report.status === 'published';

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: report.title }]} />
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

          {!hasContent ? (
            <p className="text-muted-foreground italic">
              No content yet. Edit this report to add content.
            </p>
          ) : (
            <div className="space-y-8">
              {content.executive_summary && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Executive Summary</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {content.executive_summary.body}
                  </p>
                </div>
              )}

              {content.top_risks && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Top Risks</h2>
                  <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
                    {content.top_risks.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              {content.quick_wins && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Quick Wins</h2>
                  <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
                    {content.quick_wins.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              {content.user_impact && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">User Impact</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(
                      Object.keys(content.user_impact) as Array<keyof typeof content.user_impact>
                    ).map((key) => (
                      <div key={key} className="rounded-lg border p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          {USER_IMPACT_LABELS[key] ?? key}
                        </p>
                        <p className="text-sm leading-relaxed">{content.user_impact![key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <span>{Object.keys(content).length}</span>
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
