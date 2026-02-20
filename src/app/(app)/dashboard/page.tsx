import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, getRecentActivity } from '@/lib/db/dashboard';

export default function DashboardPage() {
  const stats = getDashboardStats();
  const activity = getRecentActivity();

  const severityConfig = [
    { key: 'critical', label: 'Critical', color: 'text-red-400' },
    { key: 'high', label: 'High', color: 'text-orange-400' },
    { key: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { key: 'low', label: 'Low', color: 'text-blue-400' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatsCard label="Projects" count={stats.total_projects} />
        <StatsCard label="Assessments" count={stats.total_assessments} />
        <StatsCard label="Issues" count={stats.total_issues} />
        <StatsCard label="Reports" count={stats.total_reports} />
        <StatsCard label="VPATs" count={stats.total_vpats} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issue Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {severityConfig.map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <dt className={`text-sm font-medium ${color}`}>{label}</dt>
                  <dd className="font-bold m-0">{stats.severity_breakdown[key]}</dd>
                </div>
              ))}
              <div className="border-t pt-2 flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Total</dt>
                <dd className="font-bold m-0">{stats.total_issues}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Create a project to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {activity.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 text-sm">
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs capitalize">
                      {item.type}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
