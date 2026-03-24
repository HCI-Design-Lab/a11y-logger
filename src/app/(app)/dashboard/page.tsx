import { StatsCard } from '@/components/dashboard/stats-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';
import { getActionableStats } from '@/lib/db/dashboard';

export default async function DashboardPage() {
  const actionableStats = await getActionableStats();

  return (
    <div className="space-y-6 max-w-300">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Two-column layout: left (stats + chart) | right (donut full height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: stats row stacked above line chart */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
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
          <div className="flex-1">
            <ActivityChart />
          </div>
        </div>

        {/* Right: Issue Statistics spanning full height */}
        <div className="lg:col-span-3">
          <IssueStatistics
            openTotal={actionableStats.open_issues_total}
            severityBreakdown={actionableStats.open_severity_breakdown}
          />
        </div>
      </div>

      {/* WCAG Criteria */}
      <WcagCriteria />
    </div>
  );
}
