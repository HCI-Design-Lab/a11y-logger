import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  HeadingLevel,
  TextRun,
} from 'docx';
import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import { getCriteriaForScope, CONFORMANCE_DISPLAY } from '@/lib/vpats/wcag-criteria';
import type { DbConformance } from '@/lib/vpats/wcag-criteria';

const LEVEL_TITLES: Record<string, string> = {
  A: 'Table 1: Success Criteria, Level A',
  AA: 'Table 2: Success Criteria, Level AA',
  AAA: 'Table 3: Success Criteria, Level AAA',
};

const LEVELS_UP_TO: Record<string, string[]> = {
  A: ['A'],
  AA: ['A', 'AA'],
  AAA: ['A', 'AA', 'AAA'],
};

export async function generateVpatDocx(vpat: Vpat, project: Project): Promise<Buffer> {
  const scopedCriteria = getCriteriaForScope(vpat.wcag_version, vpat.wcag_level);
  const criteriaMap = new Map(vpat.criteria_rows.map((r) => [r.criterion_code, r]));
  const levelsToShow = LEVELS_UP_TO[vpat.wcag_level] ?? ['A', 'AA'];

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: vpat.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Product: ', bold: true }),
        new TextRun(project.name),
        new TextRun({ text: '    WCAG Version: ', bold: true }),
        new TextRun(`${vpat.wcag_version} Level ${vpat.wcag_level}`),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const level of levelsToShow) {
    const rowsForLevel = scopedCriteria.filter((c) => c.level === level);
    if (rowsForLevel.length === 0) continue;

    children.push(
      new Paragraph({
        text: LEVEL_TITLES[level],
        heading: HeadingLevel.HEADING_2,
      })
    );

    const headerRow = new TableRow({
      children: ['Criteria', 'Conformance Level', 'Remarks and Explanations'].map(
        (text, i) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
            width: { size: i === 2 ? 50 : 25, type: WidthType.PERCENTAGE },
          })
      ),
    });

    const dataRows = rowsForLevel.map((c) => {
      const row = criteriaMap.get(c.criterion);
      const conformanceDisplay = row
        ? (CONFORMANCE_DISPLAY[row.conformance as DbConformance] ?? row.conformance)
        : 'Not Evaluated';
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(`${c.criterion} ${c.name}`)] }),
          new TableCell({ children: [new Paragraph(conformanceDisplay)] }),
          new TableCell({ children: [new Paragraph(row?.remarks ?? '')] }),
        ],
      });
    });

    children.push(
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ text: '' })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
