import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VpatAiPanel } from '@/components/vpats/vpat-ai-panel';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const makeRow = (overrides: Partial<VpatCriterionRow> = {}): VpatCriterionRow => ({
  id: '1',
  vpat_id: 'v1',
  criterion_id: 'c1',
  criterion_code: '1.1.1',
  criterion_name: 'Non-text Content',
  criterion_name_translated: null,
  criterion_description: 'All non-text content.',
  criterion_level: 'A',
  criterion_section: 'Perceivable',
  conformance: 'not_evaluated',
  remarks: null,
  ai_confidence: null,
  ai_reasoning: null,
  ai_referenced_issues: null,
  ai_suggested_conformance: null,
  last_generated_at: null,
  updated_at: '2026-01-01',
  issue_count: 0,
  ...overrides,
});

describe('VpatAiPanel', () => {
  it('renders criterion code in header', () => {
    render(<VpatAiPanel row={makeRow()} onClose={vi.fn()} />);
    expect(screen.getByText(/AI Analysis.*1\.1\.1/i)).toBeInTheDocument();
  });

  it('renders as a dialog with aria-modal', () => {
    render(<VpatAiPanel row={makeRow()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<VpatAiPanel row={makeRow()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<VpatAiPanel row={makeRow()} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll when mounted', () => {
    render(<VpatAiPanel row={makeRow()} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when unmounted', () => {
    const { unmount } = render(<VpatAiPanel row={makeRow()} onClose={vi.fn()} />);
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus to close button on mount', () => {
    render(<VpatAiPanel row={makeRow()} onClose={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /close/i }));
  });

  it('shows confidence badge when ai_confidence is set', () => {
    render(<VpatAiPanel row={makeRow({ ai_confidence: 'high' })} onClose={vi.fn()} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows low confidence warning when ai_confidence is low', () => {
    render(<VpatAiPanel row={makeRow({ ai_confidence: 'low' })} onClose={vi.fn()} />);
    expect(screen.getByText(/limited evidence/i)).toBeInTheDocument();
  });

  it('shows suggested conformance badge', () => {
    render(
      <VpatAiPanel row={makeRow({ ai_suggested_conformance: 'supports' })} onClose={vi.fn()} />
    );
    expect(screen.getByText('Supports')).toBeInTheDocument();
  });

  it('shows referenced issues', () => {
    render(
      <VpatAiPanel
        row={makeRow({
          ai_referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
        })}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Missing alt')).toBeInTheDocument();
  });

  it('shows SeverityBadge for referenced issue severity', () => {
    render(
      <VpatAiPanel
        row={makeRow({
          ai_referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
        })}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders referenced issue title as link when id/assessment_id/project_id present', () => {
    render(
      <VpatAiPanel
        row={makeRow({
          ai_referenced_issues: [
            {
              title: 'Missing alt',
              severity: 'high',
              id: 'issue-1',
              assessment_id: 'assess-1',
              project_id: 'proj-1',
            },
          ],
        })}
        onClose={vi.fn()}
      />
    );
    const link = screen.getByRole('link', { name: /missing alt/i });
    expect(link).toHaveAttribute('href', '/projects/proj-1/assessments/assess-1/issues/issue-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders referenced issue title as plain text when no link data', () => {
    render(
      <VpatAiPanel
        row={makeRow({
          ai_referenced_issues: [{ title: 'Missing alt', severity: 'high' }],
        })}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('link', { name: /missing alt/i })).not.toBeInTheDocument();
    expect(screen.getByText('Missing alt')).toBeInTheDocument();
  });

  it('shows empty state when no referenced issues', () => {
    render(<VpatAiPanel row={makeRow({ ai_referenced_issues: [] })} onClose={vi.fn()} />);
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it('shows reasoning text', () => {
    render(
      <VpatAiPanel row={makeRow({ ai_reasoning: 'Step 1: check images.' })} onClose={vi.fn()} />
    );
    expect(screen.getByText('Step 1: check images.')).toBeInTheDocument();
  });

  it('shows generated at timestamp', () => {
    render(
      <VpatAiPanel
        row={makeRow({ last_generated_at: '2026-03-29T10:00:00.000Z' })}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/Generated/i)).toBeInTheDocument();
  });
});
