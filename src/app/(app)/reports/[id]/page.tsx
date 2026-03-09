export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Pencil } from 'lucide-react';
import { getReport, getReportStats, parseReportContent } from '@/lib/db/reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteReportButton } from '@/components/reports/delete-report-button';
import { PublishReportButton } from '@/components/reports/publish-report-button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ReportWcagCriteriaList } from '@/components/reports/report-wcag-criteria-list';

type PageProps = { params: Promise<{ id: string }> };

const PERSONA_LABELS: Record<string, string> = {
  screen_reader: 'Screen reader user',
  low_vision: 'Low vision / magnification',
  color_vision: 'Color vision deficiency',
  keyboard_only: 'Keyboard-only / motor',
  cognitive: 'Cognitive / attention',
  deaf_hard_of_hearing: 'Deaf / hard of hearing',
};

function RisksWinsGrid({
  topRisks,
  quickWins,
}: {
  topRisks?: { items: string[] };
  quickWins?: { items: string[] };
}) {
  if (!topRisks && !quickWins) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {topRisks && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Top Risks</h3>
          <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
            {topRisks.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {quickWins && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Quick Wins</h3>
          <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
            {quickWins.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    notFound();
  }

  const content = parseReportContent(report.content);

  const stats = getReportStats(id);
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
              {/* Executive Summary card — includes top risks & quick wins */}
              {content.executive_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {content.executive_summary.body}
                    </p>

                    <RisksWinsGrid topRisks={content.top_risks} quickWins={content.quick_wins} />
                  </CardContent>
                </Card>
              )}

              {/* Top Risks / Quick Wins standalone (when no exec summary) */}
              {!content.executive_summary && (content.top_risks || content.quick_wins) && (
                <RisksWinsGrid topRisks={content.top_risks} quickWins={content.quick_wins} />
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
        <aside className="lg:w-72 shrink-0 space-y-4">
          <IssueStatistics total={stats.total} severityBreakdown={stats.severityBreakdown} />
          <ReportWcagCriteriaList criteria={stats.wcagCriteriaCounts} />
        </aside>
      </div>
    </div>
  );
}
