import type { Report } from '@/lib/db/reports';
import type { Project } from '@/lib/db/projects';

interface ReportSection {
  title: string;
  body: string;
}

function parseContent(content: string): ReportSection[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as ReportSection[];
    }
    return [];
  } catch {
    return [];
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a complete, standalone HTML document for a report.
 * Suitable for direct download or browser print-to-PDF.
 */
export function generateReportHtml(report: Report, project: Project): string {
  const sections = parseContent(report.content);
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const publishedDate = report.published_at
    ? new Date(report.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const sectionsHtml = sections
    .map(
      (section) => `
      <section class="report-section">
        <h2>${escapeHtml(section.title)}</h2>
        <div class="section-body">${escapeHtml(section.body)}</div>
      </section>`
    )
    .join('\n');

  const noSectionsHtml =
    sections.length === 0
      ? '<p class="no-content">No content sections have been added to this report.</p>'
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(report.title)}</title>
  <style>
    /* Base styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 48px;
    }

    /* Header */
    .report-header {
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .report-header h1 {
      font-size: 24pt;
      font-weight: bold;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .report-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 24px;
      font-size: 10pt;
      color: #444;
    }

    .report-meta dt {
      font-weight: bold;
      color: #1a1a1a;
    }

    .report-meta dd {
      margin: 0;
    }

    .meta-pair {
      display: flex;
      gap: 8px;
    }

    /* Content */
    .report-section {
      margin-bottom: 32px;
    }

    .report-section h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 0 0 12px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    .section-body {
      white-space: pre-wrap;
      font-size: 11pt;
    }

    .no-content {
      color: #666;
      font-style: italic;
    }

    /* Footer */
    .report-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-published {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .status-draft {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* Print styles */
    @media print {
      body {
        font-size: 11pt;
      }

      .container {
        max-width: 100%;
        padding: 0;
      }

      .report-header {
        page-break-after: avoid;
      }

      .report-section {
        page-break-inside: avoid;
      }

      .report-section h2 {
        page-break-after: avoid;
      }

      .report-footer {
        page-break-before: avoid;
      }

      @page {
        margin: 2cm 2.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="report-header">
      <h1>${escapeHtml(report.title)}</h1>
      <div class="report-meta">
        <div class="meta-pair">
          <dt>Project:</dt>
          <dd>${escapeHtml(project.name)}</dd>
        </div>
        <div class="meta-pair">
          <dt>Type:</dt>
          <dd>${escapeHtml(report.type)}</dd>
        </div>
        <div class="meta-pair">
          <dt>Status:</dt>
          <dd>
            <span class="status-badge ${report.status === 'published' ? 'status-published' : 'status-draft'}">
              ${escapeHtml(report.status)}
            </span>
          </dd>
        </div>
        ${
          publishedDate
            ? `<div class="meta-pair">
          <dt>Published:</dt>
          <dd>${escapeHtml(publishedDate)}</dd>
        </div>`
            : ''
        }
        <div class="meta-pair">
          <dt>Generated:</dt>
          <dd>${escapeHtml(generatedDate)}</dd>
        </div>
        ${
          project.product_url
            ? `<div class="meta-pair">
          <dt>Product URL:</dt>
          <dd>${escapeHtml(project.product_url)}</dd>
        </div>`
            : ''
        }
      </div>
    </header>

    <main>
      ${sectionsHtml}
      ${noSectionsHtml}
    </main>

    <footer class="report-footer">
      <p>Generated by A11y Logger &mdash; ${escapeHtml(generatedDate)}</p>
    </footer>
  </div>
</body>
</html>`;
}
