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
import type { Report, ReportStats } from '@/lib/db/reports';
import type { IssueWithContext } from '@/lib/db/issues';
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

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

function labelCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    width: { size: 25, type: WidthType.PERCENTAGE },
  });
}

function valueCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ text })],
    width: { size: 75, type: WidthType.PERCENTAGE },
  });
}

function issueDetailRow(label: string, value: string): TableRow {
  return new TableRow({ children: [labelCell(label), valueCell(value)] });
}

/**
 * Generates a DOCX report document from the provided report data.
 *
 * Produces a Word-compatible `.docx` file containing: report title and project name,
 * executive summary, top risks, quick wins, user impact table, WCAG criteria breakdown,
 * and individual issue detail tables (each starting on a new page).
 * Uses the `docx` library — no external template file is required.
 *
 * @param report - The full report record including `title`, `content` (JSON string), and metadata.
 * @param project - The project record providing the project name.
 * @param stats - Optional statistics including severity breakdown and WCAG criteria counts.
 * @param issues - Optional array of issues with full context (WCAG codes, tags, etc.) to append.
 * @returns A Promise resolving to a `Buffer` containing the `.docx` file contents.
 */
export async function generateReportDocx(
  report: Report,
  project: Project,
  stats?: ReportStats,
  issues?: IssueWithContext[]
): Promise<Buffer> {
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

  // WCAG by Criteria table
  if (stats?.wcagCriteriaCounts?.length) {
    children.push(
      new Paragraph({ text: 'WCAG Criteria', heading: HeadingLevel.HEADING_2 }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Code', bold: true })] }),
                ],
                width: { size: 15, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Criterion', bold: true })] }),
                ],
                width: { size: 70, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: 'Issues', bold: true })] }),
                ],
                width: { size: 15, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          ...stats.wcagCriteriaCounts.map(
            ({ code, name, count }) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: code })] }),
                  new TableCell({ children: [new Paragraph({ text: name ?? '' })] }),
                  new TableCell({ children: [new Paragraph({ text: String(count) })] }),
                ],
              })
          ),
        ],
      }),
      new Paragraph({ text: '' })
    );
  }

  // Issues — each on its own page
  if (issues?.length) {
    children.push(new Paragraph({ text: 'Issues', heading: HeadingLevel.HEADING_2 }));

    for (const issue of issues) {
      const rows: TableRow[] = [
        issueDetailRow('Severity', SEVERITY_LABELS[issue.severity] ?? issue.severity),
        issueDetailRow('Status', STATUS_LABELS[issue.status] ?? issue.status),
      ];

      if (issue.wcag_codes.length) {
        rows.push(issueDetailRow('WCAG', issue.wcag_codes.join(', ')));
      }
      if (issue.url) {
        rows.push(issueDetailRow('URL', issue.url));
      }
      if (issue.description) {
        rows.push(issueDetailRow('Description', stripHtml(issue.description)));
      }
      if (issue.user_impact) {
        rows.push(issueDetailRow('User Impact', issue.user_impact));
      }
      if (issue.suggested_fix) {
        rows.push(issueDetailRow('Suggested Fix', stripHtml(issue.suggested_fix)));
      }
      if (issue.selector) {
        rows.push(issueDetailRow('Selector', issue.selector));
      }

      children.push(
        new Paragraph({
          text: issue.title,
          heading: HeadingLevel.HEADING_3,
          pageBreakBefore: true,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        }),
        new Paragraph({ text: '' })
      );
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
