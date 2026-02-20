import { getDb } from './index';

export interface DashboardStats {
  total_projects: number;
  total_assessments: number;
  total_issues: number;
  total_reports: number;
  total_vpats: number;
  severity_breakdown: { critical: number; high: number; medium: number; low: number };
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'issue';
  title: string;
  created_at: string;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const total_projects = count('SELECT COUNT(*) as n FROM projects');
  const total_assessments = count('SELECT COUNT(*) as n FROM assessments');
  const total_issues = count('SELECT COUNT(*) as n FROM issues');
  const total_reports = count('SELECT COUNT(*) as n FROM reports');
  const total_vpats = count('SELECT COUNT(*) as n FROM vpats');
  const rows = db.prepare('SELECT severity, COUNT(*) as n FROM issues GROUP BY severity').all() as {
    severity: string;
    n: number;
  }[];
  const severity_breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of rows) {
    severity_breakdown[r.severity as keyof typeof severity_breakdown] = r.n;
  }
  return {
    total_projects,
    total_assessments,
    total_issues,
    total_reports,
    total_vpats,
    severity_breakdown,
  };
}

export function getRecentActivity(limit = 10): ActivityItem[] {
  const db = getDb();
  const projects = db
    .prepare(
      `SELECT id, 'project' as type, name as title, created_at FROM projects ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as ActivityItem[];
  const issues = db
    .prepare(
      `SELECT id, 'issue' as type, title, created_at FROM issues ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as ActivityItem[];
  return [...projects, ...issues]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}
