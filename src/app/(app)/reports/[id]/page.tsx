export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getReport, getReportStats, parseReportContent } from '@/lib/db/reports';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClass } from '@/components/reports/report-badge-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportActionsMenu } from '@/components/reports/report-actions-menu';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ReportWcagCriteriaList } from '@/components/reports/report-wcag-criteria-list';
import DOMPurify from 'isomorphic-dompurify';

type PageProps = { params: Promise<{ id: string }> };

const PERSONA_LABELS: Record<string, string> = {
  screen_reader: 'Screen reader user',
  low_vision: 'Low vision / magnification',
  color_vision: 'Color vision deficiency',
  keyboard_only: 'Keyboard-only / motor',
  cognitive: 'Cognitive / attention',
  deaf_hard_of_hearing: 'Deaf / hard of hearing',
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  const content = parseReportContent(report.content);

  const stats = await getReportStats(id);
  const hasContent = Object.keys(content).length > 0;
  const isPublished = report.status === 'published';

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: report.title }]} />

      {/* Header card */}
      <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-[4px] border py-6 px-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <Badge className={getStatusBadgeClass(report.status)}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <ReportActionsMenu
            reportId={report.id}
            reportTitle={report.title}
            isPublished={isPublished}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {!hasContent ? (
            <p className="text-muted-foreground italic">
              No content yet. Edit this report to add content.
            </p>
          ) : (
            <div className="space-y-8">
              {content.executive_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_strong]:font-semibold [&_em]:italic"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(content.executive_summary.body),
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {(content.top_risks || content.quick_wins) && (
                <div
                  className={`grid grid-cols-1 gap-4 ${content.top_risks && content.quick_wins ? 'sm:grid-cols-2' : ''}`}
                >
                  {content.top_risks && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Risks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                          {content.top_risks.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {content.quick_wins && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Wins</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                          {content.quick_wins.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Persona Summaries */}
              {content.user_impact && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Persona Summaries</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(
                      Object.keys(content.user_impact) as Array<keyof typeof content.user_impact>
                    ).map((key) => (
                      <Card key={key}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold">
                            {PERSONA_LABELS[key] ?? key}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed">{content.user_impact![key]}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 space-y-4 self-start sticky top-6">
          <IssueStatistics statuses={['open']} />
          <ReportWcagCriteriaList criteria={stats.wcagCriteriaCounts} />
        </aside>
      </div>
    </div>
  );
}
