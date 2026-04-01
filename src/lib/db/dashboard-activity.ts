import { sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { projects, assessments, issues } from './schema';
import type * as sqliteSchema from './schema';

function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'issue';
  title: string;
  created_at: string;
}

/**
 * Retrieves the most recently created projects and issues, merged and sorted by creation date.
 *
 * @param limit - Maximum number of activity items to return (default 10).
 * @returns Array of activity items, each with id, type ('project' | 'issue'), title, and created_at.
 */
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

/**
 * Retrieves daily creation counts for projects, assessments, and issues over a given time range.
 *
 * @param range - Time range to query: '6m' (6 months), '3m' (3 months), '1m' (1 month), or '1w' (1 week).
 * @returns Array of entries keyed by date string, each with counts for projects, assessments, and issues created on that day.
 */
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
