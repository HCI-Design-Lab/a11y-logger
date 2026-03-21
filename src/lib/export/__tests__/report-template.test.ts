import { describe, it, expect } from 'vitest';
import { generateReportHtml } from '../report-template';
import type { Report, ReportStats } from '@/lib/db/reports';
import type { Project } from '@/lib/db/projects';
import type { IssueWithContext } from '@/lib/db/issues';

const mockProject: Project = {
  id: 'project-1',
  name: 'Acme Corp Website',
  description: 'Main corporate website',
  product_url: 'https://acme.example.com',
  status: 'active',
  settings: '{}',
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockReport: Report = {
  id: 'report-1',
  assessment_ids: ['assessment-1'],
  type: 'detailed',
  title: 'Accessibility Audit Report Q1 2024',
  status: 'published',
  content: JSON.stringify({
    executive_summary: { body: 'This report covers all findings.' },
    top_risks: { items: ['Several issues were identified.'] },
    quick_wins: { items: ['Fix the issues promptly.'] },
  }),
  template_id: null,
  ai_generated: 0,
  created_by: null,
  published_at: '2024-03-01T00:00:00Z',
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

describe('generateReportHtml', () => {
  it('returns a string', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(typeof result).toBe('string');
  });

  it('contains the report title', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('Accessibility Audit Report Q1 2024');
  });

  it('contains the project name', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('Acme Corp Website');
  });

  it('contains all section titles', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('Executive Summary');
    expect(result).toContain('Top Risks');
    expect(result).toContain('Quick Wins');
  });

  it('contains all section body content', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('This report covers all findings.');
    expect(result).toContain('Several issues were identified.');
    expect(result).toContain('Fix the issues promptly.');
  });

  it('is a complete HTML document with doctype', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('includes print CSS media query', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('@media print');
  });

  it('includes semantic heading structure', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('<h1');
    expect(result).toContain('<summary>'); // was '<h2'
  });

  it('uses details/summary for collapsible sections', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('<details');
    expect(result).toContain('<summary>');
  });

  it('expands content sections by default', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('<details class="report-section" open>');
  });

  it('collapses issues section by default', () => {
    const result = generateReportHtml(
      { ...mockReport, content: '{}' },
      mockProject,
      'with-issues',
      { issues: [mockIssue] }
    );
    expect(result).toContain('<summary>Issues (');
    expect(result).not.toMatch(/<details class="report-section" open>[^<]*<summary>Issues/);
  });

  it('includes print CSS to force all details open', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('details { display: block');
  });

  it('handles a report with empty content gracefully', () => {
    const emptyReport: Report = { ...mockReport, content: '{}' };
    const result = generateReportHtml(emptyReport, mockProject);
    expect(typeof result).toBe('string');
    expect(result).toContain('Accessibility Audit Report Q1 2024');
  });

  it('handles a report with invalid JSON content gracefully', () => {
    const brokenReport: Report = { ...mockReport, content: 'not-json' };
    const result = generateReportHtml(brokenReport, mockProject);
    expect(typeof result).toBe('string');
    expect(result).toContain('Accessibility Audit Report Q1 2024');
  });

  it('includes no external dependencies (standalone document)', () => {
    const result = generateReportHtml(mockReport, mockProject);
    // Should not reference external stylesheets or scripts
    expect(result).not.toMatch(/<link[^>]+href="https?:/);
    expect(result).not.toMatch(/<script[^>]+src="https?:/);
  });

  it('includes the report status', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('published');
  });

  it('includes the report type', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('detailed');
  });

  it('escapes HTML-special characters in the report title', () => {
    const xssReport = { ...mockReport, title: '<script>alert("xss")</script>' };
    const result = generateReportHtml(xssReport, mockProject);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('uses system-ui sans-serif font stack', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('system-ui');
  });

  it('embeds app CSS custom property tokens', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('--background:');
    expect(result).toContain('--foreground:');
    expect(result).toContain('--card:');
    expect(result).toContain('--border:');
  });

  it('uses CSS custom properties for body and card colors', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).toContain('var(--background)');
    expect(result).toContain('var(--card)');
    expect(result).toContain('var(--border)');
  });

  it('does not use Georgia serif font', () => {
    const result = generateReportHtml(mockReport, mockProject);
    expect(result).not.toContain('Georgia');
  });

  const mockStats: ReportStats = {
    total: 3,
    severityBreakdown: { critical: 1, high: 1, medium: 1, low: 0 },
    wcagCriteriaCounts: [{ code: '1.1.1', name: 'Non-text Content', count: 2 }],
  };

  const mockIssue: IssueWithContext = {
    id: 'issue-1',
    project_id: 'project-1',
    project_name: 'Acme Corp Website',
    assessment_id: 'assessment-1',
    assessment_name: 'Q1 Audit',
    title: 'Missing alt text',
    description: 'Images lack alt attributes.',
    url: null,
    severity: 'critical',
    status: 'open',
    wcag_codes: ['1.1.1'],
    section_508_codes: [],
    eu_codes: [],
    ai_suggested_codes: [],
    ai_confidence_score: null,
    tags: ['images'],
    user_impact: 'Screen reader users cannot perceive images.',
    suggested_fix: 'Add descriptive alt text.',
    selector: null,
    code_snippet: null,
    evidence_media: [],
    device_type: 'desktop',
    browser: 'Chrome',
    operating_system: 'macOS',
    assistive_technology: 'VoiceOver',
    created_by: null,
    resolved_by: null,
    resolved_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('does not use hardcoded #64748b color in stats section', () => {
    const result = generateReportHtml({ ...mockReport, content: '{}' }, mockProject, 'with-chart', {
      stats: mockStats,
    });
    expect(result).not.toContain('color:#64748b');
    expect(result).not.toContain('color: #64748b');
  });

  it('does not use hardcoded #334155 color in issues section', () => {
    const result = generateReportHtml(
      { ...mockReport, content: '{}' },
      mockProject,
      'with-issues',
      { issues: [mockIssue] }
    );
    expect(result).not.toContain('color:#334155');
    expect(result).not.toContain('color: #334155');
  });
});
