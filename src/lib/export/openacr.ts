import { Document, visit } from 'yaml';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

// OpenACR adherence levels (hyphenated per spec)
const ADHERENCE_MAP: Record<string, string> = {
  supports: 'supports',
  partially_supports: 'partially-supports',
  does_not_support: 'does-not-support',
  not_applicable: 'not-applicable',
  not_evaluated: 'not-evaluated',
};

// Maps (standard_edition, wcag_version) to the OpenACR catalog ID.
// Catalog IDs correspond to files in https://github.com/GSA/openacr/tree/main/catalog
function resolveCatalog(edition: string, wcagVersion: string): string {
  const vpat = wcagVersion === '2.2' ? '2.5' : '2.4';
  if (edition === '508') return `${vpat}-edition-wcag-${wcagVersion}-508-en`;
  if (edition === 'EU') return `${vpat}-edition-wcag-${wcagVersion}-508-eu-en`;
  return `${vpat}-edition-wcag-${wcagVersion}-en`;
}

// Chapter keys per OpenACR spec
const LEVEL_TO_CHAPTER: Record<string, string> = {
  A: 'success_criteria_level_a',
  AA: 'success_criteria_level_aa',
  AAA: 'success_criteria_level_aaa',
};

interface OpenAcrCriterion {
  num: string;
  components: Array<{
    name: string;
    adherence: { level: string; notes: string };
  }>;
}

interface OpenAcrChapter {
  criteria?: OpenAcrCriterion[];
  conformance?: string;
  notes?: string;
}

export interface OpenAcrReport {
  title: string;
  product: { name: string; version: string };
  author: { name: string; email: string };
  vendor: { name: string; email: string };
  report_date: string;
  version: number;
  license: string;
  catalog: string;
  notes: string;
  evaluation_methods_used: string;
  legal_disclaimer: string;
  chapters: Record<string, OpenAcrChapter>;
}

/**
 * Builds a structured OpenACR report object from VPAT data.
 *
 * Maps VPAT criterion rows to OpenACR chapters grouped by WCAG level (A, AA, AAA).
 * Non-web chapters (hardware, software) are automatically set to "not-applicable".
 * The catalog ID is resolved from the VPAT's standard edition and WCAG version.
 *
 * @param vpat - The VPAT record including title, standard edition, and WCAG version.
 * @param project - The project associated with the VPAT, used for the product name.
 * @param rows - The criterion rows containing conformance levels and remarks.
 * @returns A structured `OpenAcrReport` object ready for YAML serialization.
 */
export function generateOpenAcr(
  vpat: Vpat,
  project: Project,
  rows: VpatCriterionRow[]
): OpenAcrReport {
  const date = new Date().toISOString().split('T')[0]!;

  // Group rows by WCAG level
  const byLevel = new Map<string, VpatCriterionRow[]>();
  for (const row of rows) {
    const level = row.criterion_level ?? 'Other';
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level)!.push(row);
  }

  const chapters: Record<string, OpenAcrChapter> = {};

  for (const [level, levelRows] of byLevel) {
    const chapterKey = LEVEL_TO_CHAPTER[level];
    if (!chapterKey) continue;
    chapters[chapterKey] = {
      criteria: levelRows.map((row) => ({
        num: row.criterion_code,
        components: [
          {
            name: 'web',
            adherence: {
              level: ADHERENCE_MAP[row.conformance] ?? row.conformance,
              notes: row.remarks ?? '',
            },
          },
        ],
      })),
    };
  }

  // Standard non-web chapters for a web-only VPAT
  chapters.hardware = { conformance: 'not-applicable', notes: 'Web-based product' };
  chapters.software = { conformance: 'not-applicable', notes: 'Web-based product' };
  chapters.support_documentation_and_services = { criteria: [] };

  return {
    title: vpat.title,
    product: { name: project.name, version: String(vpat.version_number) },
    author: { name: '', email: '' },
    vendor: { name: '', email: '' },
    report_date: date,
    version: 1,
    license: 'CC-BY-4.0',
    catalog: resolveCatalog(vpat.standard_edition, vpat.wcag_version),
    notes: vpat.description ?? '',
    evaluation_methods_used: '',
    legal_disclaimer: '',
    chapters,
  };
}

/**
 * Generates an OpenACR-compliant YAML string from VPAT data.
 *
 * Calls `generateOpenAcr` internally, then serializes the result to YAML.
 * Date strings are forced to double-quoted scalars so YAML 1.1 parsers do not
 * misinterpret them as timestamps.
 *
 * @param vpat - The VPAT record including title, standard edition, and WCAG version.
 * @param project - The project associated with the VPAT, used for the product name.
 * @param rows - The criterion rows containing conformance levels and remarks.
 * @returns A YAML string conforming to the OpenACR specification.
 */
export function generateOpenAcrYaml(
  vpat: Vpat,
  project: Project,
  rows: VpatCriterionRow[]
): string {
  const report = generateOpenAcr(vpat, project, rows);
  const doc = new Document(report);
  // Force date strings to be quoted so YAML 1.1 parsers don't interpret them as timestamps
  visit(doc, {
    Scalar(_key, node) {
      if (typeof node.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(node.value)) {
        node.type = 'QUOTE_DOUBLE';
      }
    },
  });
  return doc.toString({ lineWidth: 0 });
}
