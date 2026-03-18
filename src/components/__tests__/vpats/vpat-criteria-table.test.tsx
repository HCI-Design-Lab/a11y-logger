import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VpatCriteriaTable } from '@/components/vpats/vpat-criteria-table';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

const makeRow = (overrides: Partial<VpatCriterionRow> = {}): VpatCriterionRow => ({
  id: '1',
  vpat_id: 'v1',
  criterion_id: 'c1',
  criterion_code: '1.1.1',
  criterion_name: 'Non-text Content',
  criterion_description: 'All non-text content has a text alternative.',
  criterion_level: 'A',
  criterion_section: 'Perceivable',
  conformance: 'not_evaluated',
  remarks: null,
  ai_confidence: null,
  ai_reasoning: null,
  last_generated_at: null,
  updated_at: '2026-01-01',
  issue_count: 0,
  ...overrides,
});

// Sections start collapsed — call this to reveal row content in tests that need it.
const expandSection = (label = /expand Table 1/i) =>
  fireEvent.click(screen.getByRole('button', { name: label }));

describe('VpatCriteriaTable', () => {
  it('renders criterion code and name', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expandSection();
    expect(screen.getByText('1.1.1')).toBeInTheDocument();
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
  });

  it('shows amber left border when conformance is not_evaluated', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expandSection();
    expect(screen.getByTestId('row-1')).toHaveClass('border-amber-400');
  });

  it('does not show amber border when conformance is set', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ conformance: 'supports' })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.getByTestId('row-1')).not.toHaveClass('border-amber-400');
  });

  it('shows confidence badge when ai_confidence is set', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_confidence: 'high', remarks: 'AI text' })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows expandable reasoning button when ai_reasoning is set', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_reasoning: 'Step 1: ...', remarks: 'text' })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.getByRole('button', { name: /show reasoning for 1.1.1/i })).toBeInTheDocument();
  });

  it('renders read-only when readOnly prop is true', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        readOnly
      />
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('groups WCAG rows by level, not by principle', () => {
    const rows = [
      makeRow({
        id: '1',
        criterion_code: '1.1.1',
        criterion_level: 'A',
        criterion_section: 'Perceivable',
      }),
      makeRow({
        id: '2',
        criterion_code: '2.1.1',
        criterion_level: 'A',
        criterion_section: 'Operable',
      }),
    ];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    // Both A-level rows should appear under a single "Level A" table
    expect(screen.getByText(/Level A/i)).toBeInTheDocument();
    // Principle names should NOT appear as section headings
    expect(screen.queryByText(/^Principle/i)).not.toBeInTheDocument();
  });

  it('renders WCAG standard heading for WCAG rows', () => {
    const rows = [makeRow({ id: '1', criterion_section: 'Perceivable', criterion_level: 'A' })];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /wcag/i })).toBeInTheDocument();
  });

  it('renders Level A before Level AA for WCAG rows', () => {
    const rows = [
      makeRow({
        id: '1',
        criterion_code: '1.4.3',
        criterion_level: 'AA',
        criterion_section: 'Perceivable',
      }),
      makeRow({
        id: '2',
        criterion_code: '1.1.1',
        criterion_level: 'A',
        criterion_section: 'Perceivable',
      }),
    ];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    const tables = screen.getAllByText(/Level A/i);
    // "Level A" text from Table 1 should appear before "Level AA" text from Table 2
    expect(tables[0]!.textContent).toMatch(/Level A$/);
    expect(tables[1]!.textContent).toMatch(/Level AA/);
  });

  it('renders Section 508 heading for Chapter sections', () => {
    const rows = [makeRow({ id: '1', criterion_section: 'Chapter3', criterion_code: '302.1' })];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /section 508/i })).toBeInTheDocument();
  });

  it('renders EN 301 549 heading for Clause sections', () => {
    const rows = [makeRow({ id: '1', criterion_section: 'Clause4', criterion_code: '4.2.1' })];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /EN 301 549/i })).toBeInTheDocument();
  });

  it('does not render Section 508 heading when no 508 rows exist', () => {
    const rows = [makeRow({ id: '1', criterion_section: 'Perceivable' })];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.queryByRole('heading', { name: /section 508/i })).not.toBeInTheDocument();
  });

  it('renders WCAG sections before Section 508 sections', () => {
    const rows = [
      makeRow({ id: '1', criterion_section: 'Chapter3', criterion_code: '302.1' }),
      makeRow({ id: '2', criterion_section: 'Perceivable', criterion_code: '1.1.1' }),
    ];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    const headings = screen.getAllByRole('heading');
    const wcagIndex = headings.findIndex((h) => /wcag/i.test(h.textContent ?? ''));
    const sec508Index = headings.findIndex((h) => /section 508/i.test(h.textContent ?? ''));
    expect(wcagIndex).toBeLessThan(sec508Index);
  });

  it('calls onRowChange with row id and update when conformance changes', () => {
    const onRowChange = vi.fn();
    render(
      <VpatCriteriaTable rows={[makeRow()]} onRowChange={onRowChange} onSaveRemarks={vi.fn()} />
    );
    expandSection();
    const select = screen.getByRole('combobox', { name: /conformance for 1.1.1/i });
    fireEvent.click(select);
    const option = screen.getByRole('option', { name: /supports$/i });
    fireEvent.click(option);
    expect(onRowChange).toHaveBeenCalledWith('1', { conformance: 'supports' });
  });

  it('shows low confidence warning when ai_confidence is low', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_confidence: 'low', remarks: 'text' })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.getByText(/limited evidence/i)).toBeInTheDocument();
  });

  it('shows Generate button per row when aiEnabled and not readOnly', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        onGenerateRow={vi.fn()}
        aiEnabled
      />
    );
    expandSection();
    expect(screen.getByRole('button', { name: /generate for 1.1.1/i })).toBeInTheDocument();
  });

  it('hides Generate button when readOnly', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        onGenerateRow={vi.fn()}
        aiEnabled
        readOnly
      />
    );
    expandSection();
    expect(screen.queryByRole('button', { name: /generate for 1.1.1/i })).not.toBeInTheDocument();
  });

  it('calls onGenerateRow with row id when Generate button clicked', () => {
    const onGenerateRow = vi.fn();
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        onGenerateRow={onGenerateRow}
        aiEnabled
      />
    );
    expandSection();
    fireEvent.click(screen.getByRole('button', { name: /generate for 1.1.1/i }));
    expect(onGenerateRow).toHaveBeenCalledWith('1');
  });

  it('shows reasoning text when reasoning button is clicked', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_reasoning: 'Step 1: check images.', remarks: 'text' })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    fireEvent.click(screen.getByRole('button', { name: /show reasoning for 1.1.1/i }));
    expect(screen.getByText(/Step 1: check images/i)).toBeInTheDocument();
  });

  it('shows Generate All button when aiEnabled and not readOnly', () => {
    const onGenerateAll = vi.fn();
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        onGenerateAll={onGenerateAll}
        aiEnabled
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /generate all/i }));
    expect(onGenerateAll).toHaveBeenCalled();
  });

  it('shows Generating state and disables Generate button when generatingRowId matches', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
        onGenerateRow={vi.fn()}
        aiEnabled
        generatingRowId="1"
      />
    );
    expandSection();
    const btn = screen.getByRole('button', { name: /generating for 1.1.1/i });
    expect(btn).toBeDisabled();
  });

  it('shows issue count after criterion name when issue_count > 0', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ issue_count: 3 })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('does not show issue count when issue_count is 0', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ issue_count: 0 })]}
        onRowChange={vi.fn()}
        onSaveRemarks={vi.fn()}
      />
    );
    expandSection();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('sections are collapsed by default', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();
  });

  it('shows resolved/total count when collapsed by default', () => {
    const rows = [
      makeRow({ id: '1', conformance: 'supports' }),
      makeRow({ id: '2', criterion_code: '1.2.1', conformance: 'not_evaluated' }),
    ];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    expect(screen.getByText(/1 of 2 resolved/i)).toBeInTheDocument();
  });

  it('expands a section when the toggle button is clicked', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /expand Table 1/i }));
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });

  it('collapses an expanded section when toggle is clicked again', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /expand Table 1/i }));
    fireEvent.click(screen.getByRole('button', { name: /collapse Table 1/i }));
    expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();
  });

  it('calls onSaveRemarks with row id and value after debounce', () => {
    vi.useFakeTimers();
    const onSaveRemarks = vi.fn();
    render(
      <VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} onSaveRemarks={onSaveRemarks} />
    );
    expandSection();
    const textarea = screen.getByRole('textbox', { name: /remarks for 1.1.1/i });
    fireEvent.change(textarea, { target: { value: 'New remark' } });
    expect(onSaveRemarks).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onSaveRemarks).toHaveBeenCalledWith('1', 'New remark');
    vi.useRealTimers();
  });
});
