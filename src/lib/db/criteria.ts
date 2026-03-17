import { getDb } from './index';

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

const SECTION_LABELS: Record<string, string> = {
  A: 'Table 1: Success Criteria, Level A',
  AA: 'Table 2: Success Criteria, Level AA',
  AAA: 'Table 3: Success Criteria, Level AAA',
  Perceivable: 'Perceivable',
  Operable: 'Operable',
  Understandable: 'Understandable',
  Robust: 'Robust',
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

export function getCriteriaForEdition(
  edition: StandardEdition,
  productScope: string[],
  wcagVersion: '2.0' | '2.1' | '2.2',
  wcagLevel: 'A' | 'AA' | 'AAA'
): CriteriaSection[] {
  const db = getDb();
  const allowedVersions = getAllowedVersions(edition, wcagVersion);
  const allowedLevels = getAllowedLevels(edition, wcagLevel);

  // Step 3: Query all WCAG criteria and filter in JS
  const allWcag = db
    .prepare("SELECT * FROM criteria WHERE standard = 'WCAG' ORDER BY sort_order")
    .all() as CriterionDbRow[];

  const filteredWcag = allWcag.map(parseCriterion).filter((c) => {
    const editionMatch = c.editions.includes(edition);
    const versionMatch = c.wcag_version !== null && allowedVersions.includes(c.wcag_version);
    const levelMatch = c.level !== null && allowedLevels.includes(c.level);
    return editionMatch && versionMatch && levelMatch;
  });

  // Step 4: Group WCAG criteria by level (A/AA/AAA)
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
  for (const [section, criteria] of wcagSectionsMap) {
    if (criteria.length > 0) {
      wcagSections.push({
        section,
        label: SECTION_LABELS[section] ?? section,
        criteria,
      });
    }
  }

  // Step 5: Query non-WCAG criteria for non-WCAG editions
  if (edition === 'WCAG') {
    return wcagSections;
  }

  let nonWcagQuery: string;
  if (edition === '508') {
    nonWcagQuery = "SELECT * FROM criteria WHERE standard = '508' ORDER BY sort_order";
  } else if (edition === 'EU') {
    nonWcagQuery = "SELECT * FROM criteria WHERE standard = 'EN301549' ORDER BY sort_order";
  } else {
    // INT
    nonWcagQuery =
      "SELECT * FROM criteria WHERE standard IN ('508', 'EN301549') ORDER BY sort_order";
  }

  const allNonWcag = db.prepare(nonWcagQuery).all() as CriterionDbRow[];

  const filteredNonWcag = allNonWcag
    .map(parseCriterion)
    .filter((c) => c.editions.includes(edition));

  // Step 6: Apply autoNotApplicable detection
  for (const criterion of filteredNonWcag) {
    criterion.autoNotApplicable = computeAutoNotApplicable(criterion, productScope);
  }

  // Step 7: Group non-WCAG criteria by chapter_section (preserving sort order)
  const nonWcagSectionsMap = new Map<string, Criterion[]>();
  for (const criterion of filteredNonWcag) {
    const section = criterion.chapter_section;
    if (!nonWcagSectionsMap.has(section)) {
      nonWcagSectionsMap.set(section, []);
    }
    nonWcagSectionsMap.get(section)!.push(criterion);
  }

  const nonWcagSections: CriteriaSection[] = [];
  for (const [section, criteria] of nonWcagSectionsMap) {
    nonWcagSections.push({
      section,
      label: SECTION_LABELS[section] ?? section,
      criteria,
    });
  }

  // Step 8: Return WCAG sections first, then non-WCAG sections
  return [...wcagSections, ...nonWcagSections];
}

export function getCriterion(id: string): Criterion | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM criteria WHERE id = ?').get(id) as
    | CriterionDbRow
    | undefined;
  return row ? parseCriterion(row) : null;
}
