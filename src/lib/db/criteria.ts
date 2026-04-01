import { eq, inArray, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { criteria } from './schema';
import type * as sqliteSchema from './schema';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export type StandardEdition = 'WCAG' | '508' | 'EU' | 'INT';

export interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string;
  standard: 'WCAG' | '508' | 'EN301549';
  chapter_section: string;
  wcag_version: '2.0' | '2.1' | '2.2' | null;
  level: 'A' | 'AA' | 'AAA' | null;
  editions: string[];
  product_types: string[];
  sort_order: number;
  autoNotApplicable?: boolean;
}

export interface CriteriaSection {
  section: string;
  label: string;
  criteria: Criterion[];
}

// WCAG criteria are grouped by level (A/AA/AAA), not by principle.
// Perceivable/Operable/Understandable/Robust are not used as section keys.
const SECTION_LABELS: Record<string, string> = {
  A: 'Table 1: Success Criteria, Level A',
  AA: 'Table 2: Success Criteria, Level AA',
  AAA: 'Table 3: Success Criteria, Level AAA',
  Chapter3: 'Chapter 3: Functional Performance Criteria',
  Chapter5: 'Chapter 5: Software',
  Chapter6: 'Chapter 6: Support Documentation and Services',
  Clause4: 'Clause 4: Functional Performance Statements',
  Clause5: 'Clause 5: Generic Requirements',
  Clause11: 'Clause 11: Non-Web Software',
  Clause12: 'Clause 12: Documentation and Support Services',
};

// Raw DB row shape (JSON fields as strings)
interface CriterionDbRow {
  id: string;
  code: string;
  name: string;
  description: string;
  standard: string;
  chapter_section: string;
  wcag_version: string | null;
  level: string | null;
  editions: string;
  product_types: string;
  sort_order: number;
}

function parseCriterion(row: CriterionDbRow): Criterion {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    standard: row.standard as Criterion['standard'],
    chapter_section: row.chapter_section,
    wcag_version: row.wcag_version as Criterion['wcag_version'],
    level: row.level as Criterion['level'],
    editions: JSON.parse(row.editions || '[]'),
    product_types: JSON.parse(row.product_types || '[]'),
    sort_order: row.sort_order,
  };
}

function getAllowedVersions(
  edition: StandardEdition,
  wcagVersion: '2.0' | '2.1' | '2.2'
): string[] {
  if (edition === '508') {
    return ['2.0'];
  }
  if (wcagVersion === '2.1') {
    return ['2.0', '2.1'];
  }
  if (wcagVersion === '2.2') {
    return ['2.0', '2.1', '2.2'];
  }
  return ['2.0'];
}

function getAllowedLevels(edition: StandardEdition, wcagLevel: 'A' | 'AA' | 'AAA'): string[] {
  if (edition === '508' || edition === 'EU') {
    return ['A', 'AA'];
  }
  if (wcagLevel === 'A') return ['A'];
  if (wcagLevel === 'AA') return ['A', 'AA'];
  return ['A', 'AA', 'AAA'];
}

function isSoftwareSection(section: string): boolean {
  return section === 'Chapter5' || section === 'Clause11';
}

function computeAutoNotApplicable(criterion: Criterion, productScope: string[]): boolean {
  if (isSoftwareSection(criterion.chapter_section)) {
    return !productScope.includes('software-desktop') && !productScope.includes('software-mobile');
  }
  return false;
}

/**
 * Retrieves all applicable accessibility criteria for a given VPAT edition, grouped into sections.
 * WCAG criteria are grouped by level (A/AA/AAA); non-WCAG criteria are grouped by chapter/clause.
 * Criteria in software-only sections are automatically marked as not-applicable when the product scope
 * does not include desktop or mobile software.
 *
 * @param edition - The VPAT standard edition ('WCAG', '508', 'EU', or 'INT').
 * @param productScope - Array of product type strings (e.g. ['web', 'software-desktop']).
 * @param wcagVersion - The WCAG version ceiling to include ('2.0', '2.1', or '2.2').
 * @param wcagLevel - The WCAG conformance level ceiling to include ('A', 'AA', or 'AAA').
 * @returns Array of criteria sections each containing a label and the matching criteria records.
 */
export async function getCriteriaForEdition(
  edition: StandardEdition,
  productScope: string[],
  wcagVersion: '2.0' | '2.1' | '2.2',
  wcagLevel: 'A' | 'AA' | 'AAA'
): Promise<CriteriaSection[]> {
  const allowedVersions = getAllowedVersions(edition, wcagVersion);
  const allowedLevels = getAllowedLevels(edition, wcagLevel);

  // Query all WCAG criteria and filter in JS (JSON array fields require JS-side filtering)
  const allWcagRows = await db()
    .select()
    .from(criteria)
    .where(eq(criteria.standard, 'WCAG'))
    .orderBy(criteria.sort_order);

  const filteredWcag = (allWcagRows as CriterionDbRow[]).map(parseCriterion).filter((c) => {
    const editionMatch = c.editions.includes(edition);
    const versionMatch = c.wcag_version !== null && allowedVersions.includes(c.wcag_version);
    const levelMatch = c.level !== null && allowedLevels.includes(c.level);
    return editionMatch && versionMatch && levelMatch;
  });

  // Group WCAG criteria by level (A/AA/AAA)
  const wcagSectionsMap = new Map<string, Criterion[]>();
  for (const level of allowedLevels) {
    wcagSectionsMap.set(level, []);
  }
  for (const criterion of filteredWcag) {
    if (criterion.level && wcagSectionsMap.has(criterion.level)) {
      wcagSectionsMap.get(criterion.level)!.push(criterion);
    }
  }

  const wcagSections: CriteriaSection[] = [];
  for (const [section, sectionCriteria] of wcagSectionsMap) {
    if (sectionCriteria.length > 0) {
      wcagSections.push({
        section,
        label: SECTION_LABELS[section] ?? section,
        criteria: sectionCriteria,
      });
    }
  }

  // Return only WCAG sections for WCAG edition
  if (edition === 'WCAG') {
    return wcagSections;
  }

  // Query non-WCAG criteria for non-WCAG editions
  let nonWcagRows: CriterionDbRow[];
  if (edition === '508') {
    nonWcagRows = (await db()
      .select()
      .from(criteria)
      .where(eq(criteria.standard, '508'))
      .orderBy(criteria.sort_order)) as CriterionDbRow[];
  } else if (edition === 'EU') {
    nonWcagRows = (await db()
      .select()
      .from(criteria)
      .where(eq(criteria.standard, 'EN301549'))
      .orderBy(criteria.sort_order)) as CriterionDbRow[];
  } else {
    // INT edition: both 508 and EN301549
    nonWcagRows = (await db()
      .select()
      .from(criteria)
      .where(sql`${criteria.standard} IN ('508', 'EN301549')`)
      .orderBy(criteria.sort_order)) as CriterionDbRow[];
  }

  const filteredNonWcag = nonWcagRows
    .map(parseCriterion)
    .filter((c) => c.editions.includes(edition));

  // Apply autoNotApplicable detection — only set when true, leave undefined otherwise
  for (const criterion of filteredNonWcag) {
    const ana = computeAutoNotApplicable(criterion, productScope);
    if (ana) {
      criterion.autoNotApplicable = true;
    }
  }

  // Group non-WCAG criteria by chapter_section (preserving sort order)
  const nonWcagSectionsMap = new Map<string, Criterion[]>();
  for (const criterion of filteredNonWcag) {
    const section = criterion.chapter_section;
    if (!nonWcagSectionsMap.has(section)) {
      nonWcagSectionsMap.set(section, []);
    }
    nonWcagSectionsMap.get(section)!.push(criterion);
  }

  const nonWcagSections: CriteriaSection[] = [];
  for (const [section, sectionCriteria] of nonWcagSectionsMap) {
    nonWcagSections.push({
      section,
      label: SECTION_LABELS[section] ?? section,
      criteria: sectionCriteria,
    });
  }

  // Return WCAG sections first, then non-WCAG sections
  return [...wcagSections, ...nonWcagSections];
}

/**
 * Retrieves a single criterion by its ID.
 *
 * @param id - The UUID of the criterion to retrieve.
 * @returns The parsed criterion record, or null if not found.
 */
export async function getCriterion(id: string): Promise<Criterion | null> {
  const rows = await db().select().from(criteria).where(eq(criteria.id, id)).limit(1);
  return rows[0] ? parseCriterion(rows[0] as CriterionDbRow) : null;
}

/**
 * Returns a Map of criterion code → criterion id for the given codes.
 * Codes not found in the criteria table are omitted from the result.
 */
export async function getCriteriaByCode(codes: string[]): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map();
  const rows = await db()
    .select({ id: criteria.id, code: criteria.code })
    .from(criteria)
    .where(inArray(criteria.code, codes));
  return new Map(rows.map((r) => [r.code, r.id]));
}
