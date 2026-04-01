import { sql, eq, inArray, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { issues, assessments } from './schema';
import type * as sqliteSchema from './schema';
import {
  getPrincipleFromCode,
  getWcagCriterionName,
  type WcagPrinciple,
} from '@/lib/wcag-criteria';

function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface WcagCriteriaCount {
  code: string;
  name: string | undefined;
  count: number;
}

// --- getSeverityBreakdown ---
export interface SeverityBreakdown {
  breakdown: { critical: number; high: number; medium: number; low: number };
  total: number;
}

/**
 * Counts issues grouped by severity, filtered by status and optionally by project.
 *
 * @param statuses - Array of issue statuses to include (default ['open']).
 * @param projectId - Optional project UUID; omit to count across all projects.
 * @returns Object with a per-severity breakdown and a total count.
 */
export async function getSeverityBreakdown(
  statuses: string[] = ['open'],
  projectId?: string
): Promise<SeverityBreakdown> {
  if (statuses.length === 0)
    return { breakdown: { critical: 0, high: 0, medium: 0, low: 0 }, total: 0 };

  const statusFilter = inArray(issues.status, statuses);
  const severityRows = projectId
    ? await db()
        .select({ severity: issues.severity, n: sql<number>`COUNT(*)`.as('n') })
        .from(issues)
        .innerJoin(assessments, eq(assessments.id, issues.assessment_id))
        .where(and(statusFilter, eq(assessments.project_id, projectId)))
        .groupBy(issues.severity)
    : await db()
        .select({ severity: issues.severity, n: sql<number>`COUNT(*)`.as('n') })
        .from(issues)
        .where(statusFilter)
        .groupBy(issues.severity);

  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  let total = 0;
  for (const r of severityRows) {
    if (r.severity in breakdown) {
      breakdown[r.severity as keyof typeof breakdown] = r.n;
      total += r.n;
    }
  }
  return { breakdown, total };
}

// --- getPourTotals ---
export interface PourTotals {
  perceivable: number;
  operable: number;
  understandable: number;
  robust: number;
}

/**
 * Returns the count of WCAG code occurrences per POUR principle across all open issues.
 * An issue with wcag_codes=['1.1.1','1.4.3'] contributes 2 to Perceivable.
 * This is a violation count, consistent with getWcagCriteriaCounts.
 */
export async function getPourTotals(statuses: string[] = ['open']): Promise<PourTotals> {
  if (statuses.length === 0) return { perceivable: 0, operable: 0, understandable: 0, robust: 0 };
  const rows = await db()
    .select({ wcag_codes: issues.wcag_codes })
    .from(issues)
    .where(
      and(
        inArray(issues.status, statuses),
        sql`${issues.wcag_codes} IS NOT NULL AND ${issues.wcag_codes} != '[]'`
      )
    );

  const totals: PourTotals = { perceivable: 0, operable: 0, understandable: 0, robust: 0 };
  for (const row of rows) {
    let codes: string[] = [];
    try {
      codes = JSON.parse(row.wcag_codes);
    } catch {
      continue;
    }
    for (const code of codes) {
      const principle = getPrincipleFromCode(code);
      if (principle && principle in totals) totals[principle as keyof PourTotals]++;
    }
  }
  return totals;
}

// --- getRepeatOffenders ---
export interface RepeatOffender {
  code: string;
  name: string | undefined;
  project_count: number;
  issue_count: number;
}

/**
 * Identifies WCAG criteria that appear across the most projects with open issues.
 *
 * @returns Array of repeat offender entries sorted by project_count then issue_count, each with the WCAG code, name, project count, and issue count.
 */
export async function getRepeatOffenders(): Promise<RepeatOffender[]> {
  const rows = await db()
    .select({
      wcag_codes: issues.wcag_codes,
      project_id: assessments.project_id,
    })
    .from(issues)
    .innerJoin(assessments, eq(assessments.id, issues.assessment_id))
    .where(
      sql`${issues.status} = 'open' AND ${issues.wcag_codes} IS NOT NULL AND ${issues.wcag_codes} != '[]'`
    );

  const codeMap = new Map<string, { projects: Set<string>; count: number }>();
  for (const row of rows) {
    let codes: string[] = [];
    try {
      codes = JSON.parse(row.wcag_codes);
    } catch {
      continue;
    }
    for (const code of codes) {
      if (!codeMap.has(code)) codeMap.set(code, { projects: new Set(), count: 0 });
      const entry = codeMap.get(code)!;
      entry.projects.add(row.project_id);
      entry.count++;
    }
  }

  return Array.from(codeMap.entries())
    .map(([code, { projects, count }]) => ({
      code,
      name: getWcagCriterionName(code),
      project_count: projects.size,
      issue_count: count,
    }))
    .sort((a, b) => b.project_count - a.project_count || b.issue_count - a.issue_count);
}

// --- getEnvironmentBreakdown ---
export interface EnvironmentEntry {
  device_type: string;
  assistive_technology: string;
  count: number;
}

/**
 * Counts open issues grouped by device_type and assistive_technology combination.
 *
 * @returns Array of environment entries sorted by count descending, each with device_type, assistive_technology, and count.
 */
export async function getEnvironmentBreakdown(): Promise<EnvironmentEntry[]> {
  const rows = await db()
    .select({
      device_type: issues.device_type,
      assistive_technology: issues.assistive_technology,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(issues)
    .where(
      sql`${issues.status} = 'open' AND ${issues.device_type} IS NOT NULL AND ${issues.assistive_technology} IS NOT NULL`
    )
    .groupBy(issues.device_type, issues.assistive_technology)
    .orderBy(sql`COUNT(*) DESC`);

  return rows as EnvironmentEntry[];
}

// --- getTagFrequency ---
export interface TagFrequencyEntry {
  tag: string;
  count: number;
}

/**
 * Counts how often each tag appears across open issues.
 *
 * @returns Array of tag frequency entries sorted by count descending, each with the tag string and its count.
 */
export async function getTagFrequency(): Promise<TagFrequencyEntry[]> {
  const rows = await db()
    .select({ tags: issues.tags })
    .from(issues)
    .where(
      sql`${issues.status} = 'open' AND ${issues.tags} IS NOT NULL AND ${issues.tags} != '[]'`
    );

  const counts = new Map<string, number>();
  for (const row of rows) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(row.tags);
    } catch {
      continue;
    }
    for (const tag of tags) {
      if (typeof tag === 'string') counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Counts WCAG code occurrences for a specific POUR principle across issues matching the given statuses.
 *
 * @param principle - The WCAG POUR principle to filter codes by ('perceivable', 'operable', 'understandable', or 'robust').
 * @param statuses - Array of issue statuses to include (default ['open']).
 * @returns Array of WCAG criteria counts sorted by count descending, each with code, name, and count.
 */
export async function getWcagCriteriaCounts(
  principle: WcagPrinciple,
  statuses: string[] = ['open']
): Promise<WcagCriteriaCount[]> {
  if (statuses.length === 0) return [];
  // Loads all non-empty wcag_codes into memory for JS-side filtering.
  // Acceptable for this single-user offline tool; revisit if issue counts grow very large.
  const rows = await db()
    .select({ wcag_codes: issues.wcag_codes })
    .from(issues)
    .where(
      and(
        inArray(issues.status, statuses),
        sql`${issues.wcag_codes} IS NOT NULL AND ${issues.wcag_codes} != '[]'`
      )
    );

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
