import type { Vpat } from '@/lib/db/vpats';
import type { Project } from '@/lib/db/projects';
import { WCAG_CRITERIA, CONFORMANCE_DISPLAY } from '@/lib/vpats/wcag-criteria';

type DbConformance =
  | 'supports'
  | 'partially_supports'
  | 'does_not_support'
  | 'not_applicable'
  | 'not_evaluated';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getConformanceDisplay(conformance: string): string {
  return CONFORMANCE_DISPLAY[conformance as DbConformance] ?? conformance;
}

function getConformanceClass(conformance: string): string {
  switch (conformance) {
    case 'supports':
      return 'conformance-supports';
    case 'partially_supports':
      return 'conformance-partial';
    case 'does_not_support':
      return 'conformance-fails';
    case 'not_applicable':
      return 'conformance-na';
    default:
      return 'conformance-not-evaluated';
  }
}

/**
 * Generates a complete, standalone HTML document for a VPAT.
 * Suitable for direct download or browser print-to-PDF.
 */
export function generateVpatHtml(vpat: Vpat, project: Project): string {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build a map of criterion code → criteria_row for quick lookup
  const rowMap = new Map(vpat.criteria_rows.map((r) => [r.criterion_code, r]));

  // Determine which criteria to display:
  // If wcag_scope is set, filter to those criteria; otherwise show all
  const criteriaToDisplay =
    vpat.wcag_scope.length > 0
      ? WCAG_CRITERIA.filter((c) => vpat.wcag_scope.includes(c.criterion))
      : WCAG_CRITERIA;

  // Group criteria by principle
  type CriterionItem = (typeof criteriaToDisplay)[number];
  const byPrinciple = new Map<string, CriterionItem[]>();
  for (const criterion of criteriaToDisplay) {
    const list = byPrinciple.get(criterion.principle) ?? [];
    byPrinciple.set(criterion.principle, [...list, criterion]);
  }

  const principlesHtml = Array.from(byPrinciple.entries())
    .map(([principle, criteria]) => {
      const rowsHtml = criteria
        .map((criterion) => {
          const row = rowMap.get(criterion.criterion);
          const conformance = row?.conformance ?? 'not_evaluated';
          const remarks = row?.remarks ?? '';

          return `
          <tr>
            <td class="criterion-code">${escapeHtml(criterion.criterion)}</td>
            <td class="criterion-name">${escapeHtml(criterion.name)}</td>
            <td class="criterion-level level-${criterion.level.toLowerCase()}">${escapeHtml(criterion.level)}</td>
            <td class="conformance-cell ${getConformanceClass(conformance)}">${escapeHtml(getConformanceDisplay(conformance))}</td>
            <td class="remarks-cell">${remarks ? escapeHtml(remarks) : '<span class="no-remarks">—</span>'}</td>
          </tr>`;
        })
        .join('\n');

      return `
        <section class="principle-section">
          <h2>${escapeHtml(principle)}</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Criterion</th>
                <th scope="col">Name</th>
                <th scope="col">Level</th>
                <th scope="col">Conformance</th>
                <th scope="col">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </section>`;
    })
    .join('\n');

  const noRowsHtml =
    criteriaToDisplay.length === 0
      ? '<p class="no-content">No criteria have been added to this VPAT.</p>'
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vpat.title)}</title>
  <style>
    /* Base styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 48px;
    }

    /* Header */
    .vpat-header {
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }

    .vpat-header h1 {
      font-size: 22pt;
      font-weight: bold;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .vpat-meta {
      font-size: 10pt;
      color: #444;
    }

    .meta-pair {
      display: inline-flex;
      gap: 6px;
      margin-right: 24px;
      margin-bottom: 4px;
    }

    .meta-pair dt {
      font-weight: bold;
      color: #1a1a1a;
    }

    .meta-pair dd {
      margin: 0;
    }

    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 1px 6px;
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

    /* Principle sections */
    .principle-section {
      margin-bottom: 40px;
    }

    .principle-section h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 0 0 12px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #1a1a1a;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #d0d0d0;
      white-space: nowrap;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #e0e0e0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .criterion-code {
      font-family: monospace;
      font-size: 10pt;
      white-space: nowrap;
      width: 60px;
    }

    .criterion-name {
      width: 200px;
    }

    .criterion-level {
      text-align: center;
      width: 50px;
      font-weight: bold;
    }

    .level-a { color: #1d4ed8; }
    .level-aa { color: #6d28d9; }
    .level-aaa { color: #047857; }

    .conformance-cell {
      width: 140px;
      font-weight: 500;
    }

    .conformance-supports { color: #065f46; }
    .conformance-partial { color: #92400e; }
    .conformance-fails { color: #991b1b; }
    .conformance-na { color: #6b7280; }
    .conformance-not-evaluated { color: #9ca3af; font-style: italic; }

    .remarks-cell { }

    .no-remarks { color: #9ca3af; }
    .no-content { color: #666; font-style: italic; }

    /* Footer */
    .vpat-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    /* Print styles */
    @media print {
      body {
        font-size: 10pt;
      }

      .container {
        max-width: 100%;
        padding: 0;
      }

      .vpat-header {
        page-break-after: avoid;
      }

      .principle-section {
        page-break-inside: avoid;
      }

      .principle-section h2 {
        page-break-after: avoid;
      }

      table {
        page-break-inside: auto;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      thead {
        display: table-header-group;
      }

      .vpat-footer {
        page-break-before: avoid;
      }

      @page {
        margin: 1.5cm 2cm;
        size: A4 landscape;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="vpat-header">
      <h1>${escapeHtml(vpat.title)}</h1>
      <dl class="vpat-meta">
        <div class="meta-pair">
          <dt>Project:</dt>
          <dd>${escapeHtml(project.name)}</dd>
        </div>
        <div class="meta-pair">
          <dt>Version:</dt>
          <dd>v${vpat.version_number}</dd>
        </div>
        <div class="meta-pair">
          <dt>Status:</dt>
          <dd>
            <span class="status-badge ${vpat.status === 'published' ? 'status-published' : 'status-draft'}">
              ${escapeHtml(vpat.status)}
            </span>
          </dd>
        </div>
        <div class="meta-pair">
          <dt>Criteria:</dt>
          <dd>${criteriaToDisplay.length} of ${WCAG_CRITERIA.length} WCAG criteria</dd>
        </div>
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
      </dl>
    </header>

    <main>
      ${principlesHtml}
      ${noRowsHtml}
    </main>

    <footer class="vpat-footer">
      <p>Voluntary Product Accessibility Template (VPAT) &mdash; Generated by A11y Logger &mdash; ${escapeHtml(generatedDate)}</p>
    </footer>
  </div>
</body>
</html>`;
}
