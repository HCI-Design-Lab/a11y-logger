import { sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { projects, assessments, issues, reports, vpats } from './schema';
import type * as sqliteSchema from './schema';
import {
  getPrincipleFromCode,
  getWcagCriterionName,
  type WcagPrinciple,
} from '@/lib/wcag-criteria';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
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

export interface ActivityItem {
  id: string;
  type: 'project' | 'issue';
  title: string;
  created_at: string;
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

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const projectRows = await db()
    .select({
      id: projects.id,
      type: sql<'project'>`'project'`.as('type'),
      title: projects.name,
      created_at: projects.created_at,
    })
    .from(projects)
    .orderBy(sql`${projects.created_at} DESC`)
    .limit(limit);

  const issueRows = await db()
    .select({
      id: issues.id,
      type: sql<'issue'>`'issue'`.as('type'),
      title: issues.title,
      created_at: issues.created_at,
    })
    .from(issues)
    .orderBy(sql`${issues.created_at} DESC`)
    .limit(limit);

  return [...(projectRows as ActivityItem[]), ...(issueRows as ActivityItem[])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export interface TimeSeriesEntry {
  date: string;
  projects: number;
  assessments: number;
  issues: number;
}

export interface WcagCriteriaCount {
  code: string;
  name: string | undefined;
  count: number;
}

export type TimeRange = '6m' | '3m' | '1m' | '1w';

function rangeToStartDate(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case '6m':
      now.setMonth(now.getMonth() - 6);
      break;
    case '3m':
      now.setMonth(now.getMonth() - 3);
      break;
    case '1m':
      now.setMonth(now.getMonth() - 1);
      break;
    case '1w':
      now.setDate(now.getDate() - 7);
      break;
  }
  return now.toISOString().slice(0, 10);
}

export async function getTimeSeriesData(range: TimeRange): Promise<TimeSeriesEntry[]> {
  const startDate = rangeToStartDate(range);

  const projectRows = await db()
    .select({
      date: sql<string>`date(${projects.created_at})`.as('date'),
      n: sql<number>`COUNT(*)`.as('n'),
    })
    .from(projects)
    .where(sql`date(${projects.created_at}) >= ${startDate}`)
    .groupBy(sql`date(${projects.created_at})`);

  const assessmentRows = await db()
    .select({
      date: sql<string>`date(${assessments.created_at})`.as('date'),
      n: sql<number>`COUNT(*)`.as('n'),
    })
    .from(assessments)
    .where(sql`date(${assessments.created_at}) >= ${startDate}`)
    .groupBy(sql`date(${assessments.created_at})`);

  const issueRows = await db()
    .select({
      date: sql<string>`date(${issues.created_at})`.as('date'),
      n: sql<number>`COUNT(*)`.as('n'),
    })
    .from(issues)
    .where(sql`date(${issues.created_at}) >= ${startDate}`)
    .groupBy(sql`date(${issues.created_at})`);

  const dateMap = new Map<string, TimeSeriesEntry>();

  const ensureDate = (date: string) => {
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, projects: 0, assessments: 0, issues: 0 });
    }
    return dateMap.get(date)!;
  };

  for (const r of projectRows) ensureDate(r.date).projects = r.n;
  for (const r of assessmentRows) ensureDate(r.date).assessments = r.n;
  for (const r of issueRows) ensureDate(r.date).issues = r.n;

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
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

export async function getWcagCriteriaCounts(
  principle: WcagPrinciple
): Promise<WcagCriteriaCount[]> {
  // Loads all non-empty wcag_codes into memory for JS-side filtering.
  // Acceptable for this single-user offline tool; revisit if issue counts grow very large.
  const rows = await db()
    .select({ wcag_codes: issues.wcag_codes })
    .from(issues)
    .where(sql`${issues.wcag_codes} IS NOT NULL AND ${issues.wcag_codes} != '[]'`);

  const counts = new Map<string, number>();

  for (const row of rows) {
    let codes: string[] = [];
    try {
      codes = JSON.parse(row.wcag_codes);
    } catch {
      continue;
    }
    for (const code of codes) {
      if (typeof code !== 'string') continue;
      if (getPrincipleFromCode(code) !== principle) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({ code, name: getWcagCriterionName(code), count }))
    .sort((a, b) => b.count - a.count);
}
