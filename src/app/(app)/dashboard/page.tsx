import { StatsCard } from '@/components/dashboard/stats-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';
import { getDashboardStats } from '@/lib/db/dashboard';

export default function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Two-column layout: left (stats + chart) | right (donut full height) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: stats row stacked above line chart */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-4">
            <StatsCard label="Projects" count={stats.total_projects} />
            <StatsCard label="Assessments" count={stats.total_assessments} />
            <StatsCard label="Issues" count={stats.total_issues} />
            <StatsCard label="Reports" count={stats.total_reports} />
            <StatsCard label="VPATs" count={stats.total_vpats} />
          </div>
          <div className="flex-1">
            <ActivityChart />
          </div>
        </div>

        {/* Right: Issue Statistics spanning full height */}
        <div className="lg:col-span-2">
          <IssueStatistics
            total={stats.total_issues}
            severityBreakdown={stats.severity_breakdown}
          />
        </div>
      </div>

      {/* WCAG Criteria */}
      <WcagCriteria />
    </div>
  );
}
