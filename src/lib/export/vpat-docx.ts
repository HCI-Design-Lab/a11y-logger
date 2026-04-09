import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  Packer,
  WidthType,
} from 'docx';

// Usable page width: Letter 8.5" − 2" margins = 6.5" = 9360 twips (DXA)
const PAGE_WIDTH = 9360;

// 3-column layout: Criteria 45%, Conformance 20%, Remarks 35%
const COL3 = {
  criteria: Math.round(PAGE_WIDTH * 0.45), // 4212
  conformance: Math.round(PAGE_WIDTH * 0.2), // 1872
  remarks: Math.round(PAGE_WIDTH * 0.35), // 3276
};

// 4-column layout: Criteria 40%, Component 15%, Conformance 20%, Remarks 25%
const COL4 = {
  criteria: Math.round(PAGE_WIDTH * 0.4), // 3744
  component: Math.round(PAGE_WIDTH * 0.15), // 1404
  conformance: Math.round(PAGE_WIDTH * 0.2), // 1872
  remarks: Math.round(PAGE_WIDTH * 0.25), // 2340
};
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';
import type { VpatCoverSheetRow } from '@/lib/db/schema';

const CONFORMANCE_DISPLAY: Record<string, string> = {
  supports: 'Supports',
  partially_supports: 'Partially Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
  not_evaluated: 'Not Evaluated',
};

// Canonical section order matching the real VPAT 2.x template
const SECTION_ORDER = [
  'A',
  'AA',
  'AAA',
  'Chapter3',
  'Chapter5',
  'Chapter6',
  'Clause4',
  'Clause5',
  'Clause12',
];

const SECTION_LABELS: Record<string, string> = {
  A: 'Table 1: Success Criteria, Level A',
  AA: 'Table 2: Success Criteria, Level AA',
  AAA: 'Table 3: Success Criteria, Level AAA',
  Chapter3: 'Chapter 3: Functional Performance Criteria',
  Chapter5: 'Chapter 5: Software',
  Chapter6: 'Chapter 6: Support Documentation and Services',
  Clause4: 'Clause 4: Functional Performance Statements',
  Clause5: 'Clause 5: Generic Requirements',
  Clause12: 'Clauses 11-12: Documentation and Support Services',
};

// Sort criterion codes numerically: "1.2.3" < "1.10.1"
function sortCode(code: string): number[] {
  return code.split('.').map((n) => parseInt(n, 10) || 0);
}

function compareCode(a: string, b: string): number {
  const pa = sortCode(a);
  const pb = sortCode(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function headerRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: COL3.criteria, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Criteria', bold: true })] })],
      }),
      new TableCell({
        width: { size: COL3.conformance, type: WidthType.DXA },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Conformance Level', bold: true })] }),
        ],
      }),
      new TableCell({
        width: { size: COL3.remarks, type: WidthType.DXA },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Remarks and Explanations', bold: true })],
          }),
        ],
      }),
    ],
  });
}

function multiComponentHeaderRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: COL4.criteria, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Criteria', bold: true })] })],
      }),
      new TableCell({
        width: { size: COL4.component, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Component', bold: true })] })],
      }),
      new TableCell({
        width: { size: COL4.conformance, type: WidthType.DXA },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Conformance Level', bold: true })] }),
        ],
      }),
      new TableCell({
        width: { size: COL4.remarks, type: WidthType.DXA },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Remarks and Explanations', bold: true })],
          }),
        ],
      }),
    ],
  });
}

function criterionRow(row: VpatCriterionRow): TableRow {
  const criteriaText = `${row.criterion_code} ${row.criterion_name}${row.criterion_level ? ` (Level ${row.criterion_level})` : ''}`;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: COL3.criteria, type: WidthType.DXA },
        children: [new Paragraph({ text: criteriaText })],
      }),
      new TableCell({
        width: { size: COL3.conformance, type: WidthType.DXA },
        children: [
          new Paragraph({ text: CONFORMANCE_DISPLAY[row.conformance] ?? row.conformance }),
        ],
      }),
      new TableCell({
        width: { size: COL3.remarks, type: WidthType.DXA },
        children: [new Paragraph({ text: row.remarks ?? '' })],
      }),
    ],
  });
}

function multiComponentCriterionRows(row: VpatCriterionRow): TableRow[] {
  const criteriaText = `${row.criterion_code} ${row.criterion_name}${row.criterion_level ? ` (Level ${row.criterion_level})` : ''}`;
  const components = row.components ?? [];

  if (components.length === 0) {
    return [
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL4.criteria, type: WidthType.DXA },
            children: [new Paragraph({ text: criteriaText })],
          }),
          new TableCell({
            width: { size: COL4.component, type: WidthType.DXA },
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: COL4.conformance, type: WidthType.DXA },
            children: [
              new Paragraph({ text: CONFORMANCE_DISPLAY[row.conformance] ?? row.conformance }),
            ],
          }),
          new TableCell({
            width: { size: COL4.remarks, type: WidthType.DXA },
            children: [new Paragraph({ text: row.remarks ?? '' })],
          }),
        ],
      }),
    ];
  }

  return components.map(
    (comp, i) =>
      new TableRow({
        children: [
          ...(i === 0
            ? [
                new TableCell({
                  width: { size: COL4.criteria, type: WidthType.DXA },
                  rowSpan: components.length,
                  children: [new Paragraph({ text: criteriaText })],
                }),
              ]
            : []),
          new TableCell({
            width: { size: COL4.component, type: WidthType.DXA },
            children: [new Paragraph({ text: comp.component_name })],
          }),
          new TableCell({
            width: { size: COL4.conformance, type: WidthType.DXA },
            children: [
              new Paragraph({ text: CONFORMANCE_DISPLAY[comp.conformance] ?? comp.conformance }),
            ],
          }),
          new TableCell({
            width: { size: COL4.remarks, type: WidthType.DXA },
            children: [new Paragraph({ text: comp.remarks ?? '' })],
          }),
        ],
      })
  );
}

/**
 * Generates a DOCX VPAT document from the provided VPAT data.
 *
 * Produces a Word-compatible `.docx` file structured according to the VPAT 2.x template.
 * Criterion rows are grouped by WCAG level (A, AA, AAA) and additional section keys
 * (e.g. Chapter3, Clause4), then sorted numerically by criterion code within each section.
 * Sections appear in canonical VPAT order; any unrecognised section keys are appended at the end.
 * Uses the `docx` library — no external template file is required.
 *
 * @param vpat - The VPAT record including title, WCAG version/level, status, and optional review metadata.
 * @param project - The project record providing the product name.
 * @param rows - The criterion rows containing criterion codes, names, levels, conformance, and remarks.
 * @returns A Promise resolving to a `Buffer` containing the `.docx` file contents.
 */
export async function generateVpatDocx(
  vpat: Vpat,
  project: Project,
  rows: VpatCriterionRow[],
  coverSheet?: VpatCoverSheetRow | null
): Promise<Buffer> {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group rows by WCAG level (A, AA, AAA) — the real VPAT table grouping
  const bySection = new Map<string, VpatCriterionRow[]>();
  for (const row of rows) {
    const key = row.criterion_level ?? 'Other';
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push(row);
  }

  // Sort each section's rows numerically by criterion code
  for (const sectionRows of bySection.values()) {
    sectionRows.sort((a, b) => compareCode(a.criterion_code, b.criterion_code));
  }

  // Sections in canonical VPAT order; unknown sections appended at end
  const knownSections = SECTION_ORDER.filter((s) => bySection.has(s));
  const unknownSections = [...bySection.keys()].filter((s) => !SECTION_ORDER.includes(s));
  const orderedSections = [...knownSections, ...unknownSections];

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: vpat.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Product: ', bold: true }),
        new TextRun({ text: project.name }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Standard: ', bold: true }),
        new TextRun({ text: `WCAG ${vpat.wcag_version} Level ${vpat.wcag_level}` }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Date: ', bold: true }), new TextRun({ text: generatedDate })],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Status: ', bold: true }),
        new TextRun({ text: vpat.status.charAt(0).toUpperCase() + vpat.status.slice(1) }),
      ],
    }),
  ];

  if (vpat.reviewed_by && vpat.reviewed_at) {
    const reviewedDate = new Date(vpat.reviewed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Reviewed by ${vpat.reviewed_by} on ${reviewedDate}.`,
            italics: true,
          }),
        ],
      })
    );
  }

  children.push(new Paragraph({ text: '' }));

  // Cover sheet section
  if (coverSheet) {
    children.push(new Paragraph({ text: 'Cover Sheet', heading: HeadingLevel.HEADING_2 }));
    const coverRows: [string, string | null | undefined][] = [
      ['Product Name', coverSheet.product_name],
      ['Version', coverSheet.product_version],
      ['Description', coverSheet.product_description],
      ['Vendor', coverSheet.vendor_company],
      ['Contact', coverSheet.vendor_contact_name],
      ['Email', coverSheet.vendor_contact_email],
      ['Phone', coverSheet.vendor_contact_phone],
      ['Website', coverSheet.vendor_website],
      ['Report Date', coverSheet.report_date],
      ['Evaluation Methods', coverSheet.evaluation_methods],
      ['Notes', coverSheet.notes],
    ];
    for (const [label, value] of coverRows) {
      if (value) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${label}: `, bold: true }),
              new TextRun({ text: value }),
            ],
          })
        );
      }
    }
    children.push(new Paragraph({ text: '' }));
  }

  const isMultiComponent = rows.some((r) => (r.components?.length ?? 0) > 1);

  for (const section of orderedSections) {
    const sectionRows = bySection.get(section)!;
    const label = SECTION_LABELS[section] ?? section;
    const tableRows = isMultiComponent
      ? [multiComponentHeaderRow(), ...sectionRows.flatMap(multiComponentCriterionRows)]
      : [headerRow(), ...sectionRows.map(criterionRow)];
    const columnWidths = isMultiComponent
      ? [COL4.criteria, COL4.component, COL4.conformance, COL4.remarks]
      : [COL3.criteria, COL3.conformance, COL3.remarks];
    children.push(
      new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }),
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths,
        rows: tableRows,
      }),
      new Paragraph({ text: '' })
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
