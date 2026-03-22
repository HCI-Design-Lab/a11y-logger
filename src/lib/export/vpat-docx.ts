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
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const CONFORMANCE_DISPLAY: Record<string, string> = {
  supports: 'Supports',
  partially_supports: 'Partially Supports',
  does_not_support: 'Does Not Support',
  not_applicable: 'Not Applicable',
  not_evaluated: 'Not Evaluated',
};

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

function headerRow(labels: string[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: labels.map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        })
    ),
  });
}

function cell(text: string): TableCell {
  return new TableCell({ children: [new Paragraph({ text })] });
}

export async function generateVpatDocx(
  vpat: Vpat,
  project: Project,
  rows: VpatCriterionRow[]
): Promise<Buffer> {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group rows by section
  const bySection = new Map<string, VpatCriterionRow[]>();
  for (const row of rows) {
    if (!bySection.has(row.criterion_section)) bySection.set(row.criterion_section, []);
    bySection.get(row.criterion_section)!.push(row);
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: vpat.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ text: 'Product: ', bold: true }), new TextRun(project.name)],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Standard: ', bold: true }),
        new TextRun(`WCAG ${vpat.wcag_version} Level ${vpat.wcag_level}`),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Date: ', bold: true }), new TextRun(generatedDate)],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Status: ', bold: true }),
        new TextRun(vpat.status.charAt(0).toUpperCase() + vpat.status.slice(1)),
      ],
    }),
    new Paragraph({ text: '' }), // spacer
  ];

  for (const [section, sectionRows] of bySection.entries()) {
    const label = SECTION_LABELS[section] ?? section;
    children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow(['Criteria', 'Name', 'Level', 'Conformance Level', 'Remarks']),
          ...sectionRows.map(
            (row) =>
              new TableRow({
                children: [
                  cell(row.criterion_code),
                  cell(row.criterion_name),
                  cell(row.criterion_level ?? ''),
                  cell(CONFORMANCE_DISPLAY[row.conformance] ?? row.conformance),
                  cell(row.remarks ?? ''),
                ],
              })
          ),
        ],
      })
    );
    children.push(new Paragraph({ text: '' })); // spacer
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
