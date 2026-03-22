import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const CONFORMANCE_MAP: Record<string, string> = {
  supports: 'Supports',
  partially_supports: 'Partially Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
  not_evaluated: 'Not Evaluated',
};

function criterionId(code: string): string {
  return `success-criterion-${code.replace(/\./g, '-')}`;
}

export interface OpenAcrReport {
  title: string;
  product: { name: string; version: string };
  author: { name: string };
  vendor: { name: string };
  date: string;
  url: string;
  notes: string;
  evaluation_methods_used: string;
  legal_disclaimer: string;
  standard_version: string;
  report_items: OpenAcrReportItem[];
}

export interface OpenAcrReportItem {
  id: string;
  handle: string;
  level: string;
  criteria: { id: string }[];
  conformance_level: string;
  remarks: string;
}

export function generateOpenAcr(
  vpat: Vpat,
  project: Project,
  rows: VpatCriterionRow[]
): OpenAcrReport {
  const date = new Date().toISOString().split('T')[0]!;

  const report_items: OpenAcrReportItem[] = rows.map((row) => {
    const id = criterionId(row.criterion_code);
    return {
      id,
      handle: row.criterion_name,
      level: row.criterion_level ?? '',
      criteria: [{ id }],
      conformance_level: CONFORMANCE_MAP[row.conformance] ?? row.conformance,
      remarks: row.remarks ?? '',
    };
  });

  return {
    title: vpat.title,
    product: { name: project.name, version: String(vpat.version_number) },
    author: { name: '' },
    vendor: { name: '' },
    date,
    url: project.product_url ?? '',
    notes: vpat.description ?? '',
    evaluation_methods_used: '',
    legal_disclaimer: '',
    standard_version: `wcag-${vpat.wcag_version}`,
    report_items,
  };
}
