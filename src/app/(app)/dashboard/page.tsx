import { StatsCard } from '@/components/dashboard/stats-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';
import { getDashboardStats, getActionableStats } from '@/lib/db/dashboard';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const actionableStats = await getActionableStats();

  return (
    <div className="space-y-6 max-w-300">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Two-column layout: left (stats + chart) | right (donut full height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: stats row stacked above line chart */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-4">
            <StatsCard label="Projects" count={stats.total_projects} href="/projects" />
            <StatsCard label="Assessments" count={stats.total_assessments} href="/assessments" />
            <StatsCard label="Issues" count={stats.total_issues} href="/issues" />
            <StatsCard label="Reports" count={stats.total_reports} href="/reports" />
            <StatsCard label="VPATs" count={stats.total_vpats} href="/vpats" />
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
