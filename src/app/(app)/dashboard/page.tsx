import { StatsCard } from '@/components/dashboard/stats-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';
import { PourRadar } from '@/components/dashboard/pour-radar';
import { RepeatOffenders } from '@/components/dashboard/repeat-offenders';
import { EnvironmentHeatmap } from '@/components/dashboard/environment-heatmap';
import { TagTreemap } from '@/components/dashboard/tag-treemap';
import { getActionableStats } from '@/lib/db/dashboard';

export default async function DashboardPage() {
  const actionableStats = await getActionableStats();

  return (
    <main className="p-6 space-y-6">
      {/* Section 1: Activity */}
      <section aria-labelledby="activity-heading">
        <h1 id="activity-heading" className="sr-only">
          Dashboard
        </h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <StatsCard
            label="Open Critical Issues"
            count={actionableStats.open_critical_issues}
            href="/issues?severity=critical&status=open"
            countClassName={
              actionableStats.open_critical_issues > 0 ? 'text-destructive' : undefined
            }
          />
          <StatsCard
            label="In-Progress Assessments"
            count={actionableStats.in_progress_assessments}
            href="/assessments?status=in_progress"
          />
          <StatsCard
            label="Resolved This Month"
            count={actionableStats.resolved_this_month}
            href="/issues?status=resolved"
          />
          <StatsCard
            label="Active Projects"
            count={actionableStats.active_projects}
            subtitle={`of ${actionableStats.total_projects} total`}
            href="/projects"
          />
        </div>
        <ActivityChart />
      </section>

      {/* Section 2: Issue Analysis */}
      <section aria-labelledby="analysis-heading" className="mt-8">
        <div className="mb-4">
          <h2 id="analysis-heading" className="text-lg font-semibold">
            Issue Analysis
          </h2>
          <p className="text-sm text-muted-foreground">Open issues across all projects</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <IssueStatistics
            openTotal={actionableStats.open_issues_total}
            severityBreakdown={actionableStats.open_severity_breakdown}
          />
          <div className="lg:col-span-2">
            <PourRadar />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 mb-4">
          <RepeatOffenders />
          <EnvironmentHeatmap />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TagTreemap />
          <WcagCriteria />
        </div>
      </section>
    </main>
  );
}
