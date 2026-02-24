import { getDb } from './index';
import {
  getPrincipleFromCode,
  getWcagCriterionName,
  type WcagPrinciple,
} from '@/lib/wcag-criteria';

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

export function getTimeSeriesData(range: TimeRange): TimeSeriesEntry[] {
  const db = getDb();
  const startDate = rangeToStartDate(range);

  const projectRows = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as n FROM projects
       WHERE date(created_at) >= ? GROUP BY date(created_at)`
    )
    .all(startDate) as { date: string; n: number }[];

  const assessmentRows = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as n FROM assessments
       WHERE date(created_at) >= ? GROUP BY date(created_at)`
    )
    .all(startDate) as { date: string; n: number }[];

  const issueRows = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as n FROM issues
       WHERE date(created_at) >= ? GROUP BY date(created_at)`
    )
    .all(startDate) as { date: string; n: number }[];

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

export function getWcagCriteriaCounts(principle: WcagPrinciple): WcagCriteriaCount[] {
  const db = getDb();

  const rows = db
    .prepare(`SELECT wcag_codes FROM issues WHERE wcag_codes IS NOT NULL AND wcag_codes != '[]'`)
    .all() as { wcag_codes: string }[];

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
