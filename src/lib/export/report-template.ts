import DOMPurify from 'isomorphic-dompurify';
import type { Report, ReportStats } from '@/lib/db/reports';
import type { Project } from '@/lib/db/projects';
import type { ReportContent } from '@/lib/validators/reports';
import type { IssueWithContext } from '@/lib/db/issues';
import { getWcagCriterionName } from '@/lib/wcag-criteria';

function parseContent(content: string): ReportContent {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ReportContent;
    }
    return {};
  } catch {
    return {};
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

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function r2(n: number): string {
  return n.toFixed(2);
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
): string {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99;
  const x1 = cx + outerR * Math.cos(toRad(startDeg));
  const y1 = cy + outerR * Math.sin(toRad(startDeg));
  const x2 = cx + outerR * Math.cos(toRad(endDeg));
  const y2 = cy + outerR * Math.sin(toRad(endDeg));
  const ix1 = cx + innerR * Math.cos(toRad(endDeg));
  const iy1 = cy + innerR * Math.sin(toRad(endDeg));
  const ix2 = cx + innerR * Math.cos(toRad(startDeg));
  const iy2 = cy + innerR * Math.sin(toRad(startDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M${r2(x1)},${r2(y1)}`,
    `A${outerR},${outerR},0,${large},1,${r2(x2)},${r2(y2)}`,
    `L${r2(ix1)},${r2(iy1)}`,
    `A${innerR},${innerR},0,${large},0,${r2(ix2)},${r2(iy2)}`,
    'Z',
  ].join(' ');
}

const SEVERITY_CHART = [
  { key: 'critical' as const, label: 'Critical', color: '#ef4444' },
  { key: 'high' as const, label: 'High', color: '#f97316' },
  { key: 'medium' as const, label: 'Medium', color: '#eab308' },
  { key: 'low' as const, label: 'Low', color: '#3b82f6' },
];

function buildStatsHtml(stats: ReportStats): string {
  const { total, severityBreakdown, wcagCriteriaCounts } = stats;

  let donutSvg = '';
  if (total === 0) {
    donutSvg = '<p style="color:#666;font-style:italic">No issues linked to this report.</p>';
  } else {
    const cx = 100,
      cy = 100,
      outerR = 80,
      innerR = 50;
    let currentAngle = -90;
    const paths = SEVERITY_CHART.filter(({ key }) => severityBreakdown[key] > 0)
      .map(({ key, color }) => {
        const sweep = (severityBreakdown[key] / total) * 360;
        const path = arcPath(cx, cy, outerR, innerR, currentAngle, currentAngle + sweep);
        currentAngle += sweep;
        return `<path d="${path}" fill="${color}" />`;
      })
      .join('\n    ');

    donutSvg = `
      <div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;margin-bottom:24px">
        <div style="position:relative;flex-shrink:0">
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
            ${paths}
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
            <span style="font-size:28pt;font-weight:bold;line-height:1">${total}</span>
            <span style="font-size:9pt;color:#64748b">Total</span>
          </div>
        </div>
        <table style="border-collapse:collapse;font-size:11pt">
          <tbody>
            ${SEVERITY_CHART.map(
              ({ key, label, color }) => `
            <tr>
              <td style="padding:4px 8px 4px 0">
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle"></span>${label}
              </td>
              <td style="padding:4px 0 4px 16px;font-weight:bold;text-align:right">${severityBreakdown[key]}</td>
            </tr>`
            ).join('')}
          </tbody>
        </table>
      </div>`;
  }

  let criteriaTableBody = '';
  if (wcagCriteriaCounts.length > 0) {
    criteriaTableBody = wcagCriteriaCounts
      .map(
        ({ code, name, count }) =>
          `<tr style="border-bottom:1px solid #eee">
          <td style="padding:5px 12px 5px 0;font-size:10pt">${escapeHtml(code)}${name ? ` — ${escapeHtml(name)}` : ''}</td>
          <td style="padding:5px 0;font-weight:bold;text-align:right;white-space:nowrap">${count}</td>
        </tr>`
      )
      .join('\n');
  } else {
    criteriaTableBody = `<tr><td colspan="2" style="padding:5px 0;font-size:10pt;color:#666;font-style:italic">No WCAG criteria linked to issues.</td></tr>`;
  }
  const criteriaTable = `
      <h3 style="font-size:12pt;font-weight:bold;margin:0 0 8px 0;padding-bottom:4px;border-bottom:1px solid #ccc">WCAG Criteria Breakdown</h3>
      <table style="border-collapse:collapse;width:100%;font-size:11pt">
        <thead>
          <tr>
            <th style="text-align:left;padding:5px 12px 5px 0;color:#555;font-weight:600;border-bottom:2px solid #ccc">Criterion</th>
            <th style="text-align:right;padding:5px 0;color:#555;font-weight:600;border-bottom:2px solid #ccc">Count</th>
          </tr>
        </thead>
        <tbody>${criteriaTableBody}</tbody>
      </table>`;

  return `
    <section class="report-section">
      <h2>Issue Statistics</h2>
      ${donutSvg}
      ${criteriaTable}
    </section>`;
}

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  critical: 'background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5',
  high: 'background:#fff7ed;color:#c2410c;border:1px solid #fdba74',
  medium: 'background:#fefce8;color:#a16207;border:1px solid #fde047',
  low: 'background:#f8fafc;color:#475569;border:1px solid #cbd5e1',
};

function buildIssuesHtml(issues: IssueWithContext[], baseUrl = ''): string {
  if (issues.length === 0) {
    return `
      <section class="report-section">
        <h2>Issues</h2>
        <p style="color:#666;font-style:italic">No issues linked to this report.</p>
      </section>`;
  }

  const badgeStyle =
    'display:inline-block;padding:2px 8px;border-radius:4px;font-size:9pt;font-weight:600';
  const pillStyle =
    'display:inline-block;padding:2px 8px;border-radius:4px;font-size:9pt;font-weight:600;background:#e0e7ff;color:#4f46e5';
  const sectionHeading =
    'margin:0 0 4px;font-size:8pt;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600';

  const articles = issues
    .map((issue, i) => {
      const sev = issue.severity ?? 'low';
      const sevStyle = SEVERITY_BADGE_STYLES[sev] ?? SEVERITY_BADGE_STYLES.low;
      const wcagPills = issue.wcag_codes
        .map((code) => {
          const name = getWcagCriterionName(code);
          return `<span style="${pillStyle}">${escapeHtml(code)}${name ? ` ${escapeHtml(name)}` : ''}</span>`;
        })
        .join(' ');
      const tagPills = issue.tags
        .map(
          (t) =>
            `<span style="${badgeStyle};background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">${escapeHtml(t)}</span>`
        )
        .join(' ');

      const badges = [
        `<span style="${badgeStyle};${sevStyle}">${escapeHtml(sev.charAt(0).toUpperCase() + sev.slice(1))}</span>`,
        wcagPills,
        tagPills,
      ]
        .filter(Boolean)
        .join(' ');

      const savedDate = new Date(issue.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const sections: string[] = [];

      if (issue.description) {
        sections.push(`
        <div style="margin-bottom:16px">
          <h3 style="${sectionHeading}">Description</h3>
          <p style="margin:0;line-height:1.6;color:#334155;font-size:10pt">${escapeHtml(issue.description)}</p>
        </div>`);
      }

      if (issue.user_impact) {
        sections.push(`
        <div style="margin-bottom:16px">
          <h3 style="${sectionHeading}">User Impact</h3>
          <p style="margin:0;line-height:1.6;color:#334155;font-size:10pt">${escapeHtml(issue.user_impact)}</p>
        </div>`);
      }

      if (issue.wcag_codes.length > 0) {
        const items = issue.wcag_codes
          .map((code) => {
            const name = getWcagCriterionName(code);
            return `<li style="color:#334155;font-size:10pt">${escapeHtml(code)}${name ? ` — ${escapeHtml(name)}` : ''}</li>`;
          })
          .join('\n');
        sections.push(`
        <div style="margin-bottom:16px">
          <h3 style="${sectionHeading}">WCAG Criteria</h3>
          <ul style="margin:0;padding-left:1.25em;line-height:1.8">${items}</ul>
        </div>`);
      }

      if (issue.suggested_fix) {
        sections.push(`
        <div style="margin-bottom:16px">
          <h3 style="${sectionHeading}">Suggested Fix</h3>
          <p style="margin:0;line-height:1.6;color:#334155;font-size:10pt">${escapeHtml(issue.suggested_fix)}</p>
        </div>`);
      }

      const contextRows: string[] = [];
      if (issue.device_type)
        contextRows.push(
          `<tr><th scope="row" style="text-align:left;padding-right:16px;color:#64748b;font-weight:600;white-space:nowrap;font-size:10pt">Device</th><td style="color:#334155;font-size:10pt">${escapeHtml(issue.device_type)}</td></tr>`
        );
      if (issue.browser)
        contextRows.push(
          `<tr><th scope="row" style="text-align:left;padding-right:16px;color:#64748b;font-weight:600;white-space:nowrap;font-size:10pt">Browser</th><td style="color:#334155;font-size:10pt">${escapeHtml(issue.browser)}</td></tr>`
        );
      if (issue.operating_system)
        contextRows.push(
          `<tr><th scope="row" style="text-align:left;padding-right:16px;color:#64748b;font-weight:600;white-space:nowrap;font-size:10pt">OS</th><td style="color:#334155;font-size:10pt">${escapeHtml(issue.operating_system)}</td></tr>`
        );
      if (issue.assistive_technology)
        contextRows.push(
          `<tr><th scope="row" style="text-align:left;padding-right:16px;color:#64748b;font-weight:600;white-space:nowrap;font-size:10pt">Assistive Technology</th><td style="color:#334155;font-size:10pt">${escapeHtml(issue.assistive_technology)}</td></tr>`
        );

      if (contextRows.length > 0) {
        sections.push(`
        <div style="margin-bottom:16px">
          <h3 style="${sectionHeading}">Context</h3>
          <table style="border-collapse:collapse"><tbody>${contextRows.join('')}</tbody></table>
        </div>`);
      }

      return `
      <article aria-labelledby="issue-${i + 1}-title" style="margin-bottom:24px;padding:16px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;page-break-inside:avoid">
        <header style="margin-bottom:12px">
          <h3 id="issue-${i + 1}-title" style="margin:0 0 8px;font-size:11pt;font-weight:bold;color:#0f172a;line-height:1.4">
            <span style="color:#94a3b8;font-weight:400;margin-right:6px">#${i + 1}</span>${
              baseUrl
                ? `<a href="${escapeHtml(baseUrl)}/projects/${escapeHtml(issue.project_id)}/assessments/${escapeHtml(issue.assessment_id)}/issues/${escapeHtml(issue.id)}" style="color:inherit;text-decoration:underline;text-underline-offset:2px">${escapeHtml(issue.title)}</a>`
                : escapeHtml(issue.title)
            }
          </h3>
          <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${badges}</div>
        </header>
        ${sections.join('')}
        <footer style="font-size:8pt;color:#94a3b8;margin-top:8px">Saved ${escapeHtml(savedDate)}</footer>
      </article>`;
    })
    .join('\n');

  return `
    <section class="report-section">
      <h2>Issues (${issues.length})</h2>
      ${articles}
    </section>`;
}

const USER_IMPACT_LABELS: Record<string, string> = {
  screen_reader: 'Screen Reader',
  low_vision: 'Low Vision',
  color_vision: 'Color Vision',
  keyboard_only: 'Keyboard Only',
  cognitive: 'Cognitive',
  deaf_hard_of_hearing: 'Deaf / Hard of Hearing',
};

function buildSectionsHtml(content: ReportContent): string {
  const parts: string[] = [];

  if (content.executive_summary) {
    parts.push(`
      <section class="report-section">
        <h2>Executive Summary</h2>
        <div class="section-body">${DOMPurify.sanitize(content.executive_summary.body)}</div>
      </section>`);
  }

  if (content.top_risks) {
    const items = content.top_risks.items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('\n        ');
    parts.push(`
      <section class="report-section">
        <h2>Top Risks</h2>
        <ol class="section-list">
          ${items}
        </ol>
      </section>`);
  }

  if (content.quick_wins) {
    const items = content.quick_wins.items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('\n        ');
    parts.push(`
      <section class="report-section">
        <h2>Quick Wins</h2>
        <ol class="section-list">
          ${items}
        </ol>
      </section>`);
  }

  if (content.user_impact) {
    const grid = (Object.keys(content.user_impact) as Array<keyof typeof content.user_impact>)
      .map(
        (key) => `
          <div class="impact-card">
            <dt>${escapeHtml(USER_IMPACT_LABELS[key] ?? key)}</dt>
            <dd>${escapeHtml(content.user_impact![key])}</dd>
          </div>`
      )
      .join('\n');
    parts.push(`
      <section class="report-section">
        <h2>User Impact</h2>
        <dl class="impact-grid">
          ${grid}
        </dl>
      </section>`);
  }

  return parts.join('\n');
}

/**
 * Generates a complete, standalone HTML document for a report.
 * Suitable for direct download or browser print-to-PDF.
 */
export type ExportVariant = 'default' | 'with-chart' | 'with-issues' | 'with-all';

export function generateReportHtml(
  report: Report,
  project: Project,
  variant: ExportVariant = 'default',
  extras: { stats?: ReportStats; issues?: IssueWithContext[] } = {},
  baseUrl = ''
): string {
  const content = parseContent(report.content);
  const sectionsHtml = buildSectionsHtml(content);
  const extraParts: string[] = [];
  if ((variant === 'with-chart' || variant === 'with-all') && extras.stats) {
    extraParts.push(buildStatsHtml(extras.stats));
  }
  if ((variant === 'with-issues' || variant === 'with-all') && extras.issues) {
    extraParts.push(buildIssuesHtml(extras.issues, baseUrl));
  }
  const extrasHtml = extraParts.join('\n');
  const hasContent = Object.keys(content).length > 0;

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

  const noSectionsHtml = !hasContent
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
      font-size: 11pt;
    }

    .section-list {
      font-size: 11pt;
      padding-left: 1.5em;
    }

    .section-list li {
      margin-bottom: 6px;
    }

    /* User impact grid */
    .impact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 0;
    }

    .impact-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 16px;
    }

    .impact-card dt {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .impact-card dd {
      margin: 0;
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
      ${extrasHtml}
    </main>

    <footer class="report-footer">
      <p>Generated by A11y Logger &mdash; ${escapeHtml(generatedDate)}</p>
    </footer>
  </div>
</body>
</html>`;
}
