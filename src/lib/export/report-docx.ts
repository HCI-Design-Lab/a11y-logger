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
import type { Report } from '@/lib/db/reports';
import type { Project } from '@/lib/db/projects';

// Define locally since ReportContent may not be exported from validators
interface ReportContent {
  executive_summary?: { body?: string };
  top_risks?: { items?: string[] };
  quick_wins?: { items?: string[] };
  user_impact?: {
    screen_reader?: string;
    low_vision?: string;
    color_vision?: string;
    keyboard_only?: string;
    cognitive?: string;
    deaf_hard_of_hearing?: string;
    [key: string]: string | undefined;
  };
}

function parseContent(content: string | null | undefined): ReportContent {
  try {
    const parsed = JSON.parse(content ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ReportContent)
      : {};
  } catch {
    return {};
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const USER_IMPACT_LABELS: Record<string, string> = {
  screen_reader: 'Screen Reader Users',
  low_vision: 'Low Vision Users',
  color_vision: 'Color Vision Deficiency',
  keyboard_only: 'Keyboard-Only Users',
  cognitive: 'Cognitive Disabilities',
  deaf_hard_of_hearing: 'Deaf / Hard of Hearing',
};

export async function generateReportDocx(report: Report, project: Project): Promise<Buffer> {
  const content = parseContent(report.content);

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: report.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Project: ', bold: true }),
        new TextRun({ text: project.name }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  if (content.executive_summary?.body) {
    children.push(
      new Paragraph({ text: 'Executive Summary', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: stripHtml(content.executive_summary.body) }),
      new Paragraph({ text: '' })
    );
  }

  if (content.top_risks?.items?.length) {
    children.push(
      new Paragraph({ text: 'Top Risks', heading: HeadingLevel.HEADING_2 }),
      ...content.top_risks.items.map((item) => new Paragraph({ text: item, bullet: { level: 0 } })),
      new Paragraph({ text: '' })
    );
  }

  if (content.quick_wins?.items?.length) {
    children.push(
      new Paragraph({ text: 'Quick Wins', heading: HeadingLevel.HEADING_2 }),
      ...content.quick_wins.items.map(
        (item) => new Paragraph({ text: item, bullet: { level: 0 } })
      ),
      new Paragraph({ text: '' })
    );
  }

  if (content.user_impact) {
    const impact = content.user_impact;
    const impactRows = Object.entries(USER_IMPACT_LABELS)
      .filter(([key]) => impact[key])
      .map(
        ([key, label]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph({ text: impact[key] as string })],
              }),
            ],
          })
      );

    if (impactRows.length > 0) {
      children.push(
        new Paragraph({ text: 'User Impact', heading: HeadingLevel.HEADING_2 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: impactRows,
        }),
        new Paragraph({ text: '' })
      );
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
