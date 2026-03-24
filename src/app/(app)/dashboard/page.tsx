import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { IssueAnalysisSection } from '@/components/dashboard/issue-analysis-section';
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

      <IssueAnalysisSection />
    </main>
  );
}
