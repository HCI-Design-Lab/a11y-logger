import { sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { projects, assessments, issues, reports, vpats } from './schema';
import type * as sqliteSchema from './schema';

function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface DashboardStats {
  total_projects: number;
  total_assessments: number;
  total_issues: number;
  total_reports: number;
  total_vpats: number;
  severity_breakdown: { critical: number; high: number; medium: number; low: number };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [projectCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(projects);
  const [assessmentCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(assessments);
  const [issueCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(issues);
  const [reportCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(reports);
  const [vpatCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(vpats);

  const severityRows = await db()
    .select({
      severity: issues.severity,
      n: sql<number>`COUNT(*)`.as('n'),
    })
    .from(issues)
    .groupBy(issues.severity);

  const severity_breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of severityRows) {
    severity_breakdown[r.severity as keyof typeof severity_breakdown] = r.n;
  }

  return {
    total_projects: projectCount?.n ?? 0,
    total_assessments: assessmentCount?.n ?? 0,
    total_issues: issueCount?.n ?? 0,
    total_reports: reportCount?.n ?? 0,
    total_vpats: vpatCount?.n ?? 0,
    severity_breakdown,
  };
}

export interface ActionableStats {
  open_critical_issues: number;
  in_progress_assessments: number;
  resolved_this_month: number;
  active_projects: number;
  total_projects: number;
  open_severity_breakdown: { critical: number; high: number; medium: number; low: number };
  open_issues_total: number;
}

export async function getActionableStats(): Promise<ActionableStats> {
  const [criticalCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(issues)
    .where(sql`${issues.severity} = 'critical' AND ${issues.status} = 'open'`);

  const [inProgressCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(assessments)
    .where(sql`${assessments.status} = 'in_progress'`);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthISO = startOfMonth.toISOString().slice(0, 10);

  const [resolvedCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(issues)
    .where(
      sql`${issues.status} = 'resolved' AND date(${issues.resolved_at}) >= ${startOfMonthISO}`
    );

  const [activeProjectCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(projects)
    .where(sql`${projects.status} = 'active'`);

  const [totalProjectCount] = await db()
    .select({ n: sql<number>`COUNT(*)`.as('n') })
    .from(projects);

  const severityRows = await db()
    .select({ severity: issues.severity, n: sql<number>`COUNT(*)`.as('n') })
    .from(issues)
    .where(sql`${issues.status} = 'open'`)
    .groupBy(issues.severity);

  const open_severity_breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  let open_issues_total = 0;
  for (const r of severityRows) {
    open_severity_breakdown[r.severity as keyof typeof open_severity_breakdown] = r.n;
    open_issues_total += r.n;
  }

  return {
    open_critical_issues: criticalCount?.n ?? 0,
    in_progress_assessments: inProgressCount?.n ?? 0,
    resolved_this_month: resolvedCount?.n ?? 0,
    active_projects: activeProjectCount?.n ?? 0,
    total_projects: totalProjectCount?.n ?? 0,
    open_severity_breakdown,
    open_issues_total,
  };
}
