import { StatsCard } from '@/components/dashboard/stats-card';
import { IssueStatistics } from '@/components/dashboard/issue-statistics';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { WcagCriteria } from '@/components/dashboard/wcag-criteria';
import { getDashboardStats } from '@/lib/db/dashboard';

export default function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatsCard label="Projects" count={stats.total_projects} />
        <StatsCard label="Assessments" count={stats.total_assessments} />
        <StatsCard label="Issues" count={stats.total_issues} />
        <StatsCard label="Reports" count={stats.total_reports} />
        <StatsCard label="VPATs" count={stats.total_vpats} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityChart />
        </div>
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
