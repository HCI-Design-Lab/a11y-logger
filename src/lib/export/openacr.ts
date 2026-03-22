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
