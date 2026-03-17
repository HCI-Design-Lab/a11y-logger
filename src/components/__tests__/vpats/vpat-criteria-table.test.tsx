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
  criterion_section: 'A',
  conformance: 'not_evaluated',
  remarks: null,
  ai_confidence: null,
  ai_reasoning: null,
  last_generated_at: null,
  updated_at: '2026-01-01',
  ...overrides,
});

describe('VpatCriteriaTable', () => {
  it('renders criterion code and name', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} />);
    expect(screen.getByText('1.1.1')).toBeInTheDocument();
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
  });

  it('shows amber left border when conformance is not_evaluated', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} />);
    expect(screen.getByTestId('row-1')).toHaveClass('border-amber-400');
  });

  it('does not show amber border when conformance is set', () => {
    render(
      <VpatCriteriaTable rows={[makeRow({ conformance: 'supports' })]} onRowChange={vi.fn()} />
    );
    expect(screen.getByTestId('row-1')).not.toHaveClass('border-amber-400');
  });

  it('shows confidence badge when ai_confidence is set', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_confidence: 'high', remarks: 'AI text' })]}
        onRowChange={vi.fn()}
      />
    );
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows expandable reasoning button when ai_reasoning is set', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_reasoning: 'Step 1: ...', remarks: 'text' })]}
        onRowChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /show reasoning for 1.1.1/i })).toBeInTheDocument();
  });

  it('renders read-only when readOnly prop is true', () => {
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={vi.fn()} readOnly />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('groups rows by section', () => {
    const rows = [
      makeRow({ id: '1', criterion_code: '1.1.1', criterion_level: 'A', criterion_section: 'A' }),
      makeRow({ id: '2', criterion_code: '1.4.3', criterion_level: 'AA', criterion_section: 'AA' }),
    ];
    render(<VpatCriteriaTable rows={rows} onRowChange={vi.fn()} />);
    expect(screen.getByText(/Level A/i)).toBeInTheDocument();
    expect(screen.getByText(/Level AA/i)).toBeInTheDocument();
  });

  it('calls onRowChange with row id and update when conformance changes', () => {
    const onRowChange = vi.fn();
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={onRowChange} />);
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
      />
    );
    expect(screen.getByText(/limited evidence/i)).toBeInTheDocument();
  });

  it('shows Generate button per row when aiEnabled and not readOnly', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onGenerateRow={vi.fn()}
        aiEnabled
      />
    );
    expect(screen.getByRole('button', { name: /generate for 1.1.1/i })).toBeInTheDocument();
  });

  it('hides Generate button when readOnly', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onGenerateRow={vi.fn()}
        aiEnabled
        readOnly
      />
    );
    expect(screen.queryByRole('button', { name: /generate for 1.1.1/i })).not.toBeInTheDocument();
  });

  it('calls onGenerateRow with row id when Generate button clicked', () => {
    const onGenerateRow = vi.fn();
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
        onGenerateRow={onGenerateRow}
        aiEnabled
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /generate for 1.1.1/i }));
    expect(onGenerateRow).toHaveBeenCalledWith('1');
  });

  it('shows reasoning text when reasoning button is clicked', () => {
    render(
      <VpatCriteriaTable
        rows={[makeRow({ ai_reasoning: 'Step 1: check images.', remarks: 'text' })]}
        onRowChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /show reasoning for 1.1.1/i }));
    expect(screen.getByText(/Step 1: check images/i)).toBeInTheDocument();
  });

  it('shows Generate All button when aiEnabled and not readOnly', () => {
    const onGenerateAll = vi.fn();
    render(
      <VpatCriteriaTable
        rows={[makeRow()]}
        onRowChange={vi.fn()}
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
        onGenerateRow={vi.fn()}
        aiEnabled
        generatingRowId="1"
      />
    );
    const btn = screen.getByRole('button', { name: /generating for 1.1.1/i });
    expect(btn).toBeDisabled();
  });

  it('calls onRowChange with remarks when textarea changes', () => {
    const onRowChange = vi.fn();
    render(<VpatCriteriaTable rows={[makeRow()]} onRowChange={onRowChange} />);
    const textarea = screen.getByRole('textbox', { name: /remarks for 1.1.1/i });
    fireEvent.change(textarea, { target: { value: 'New remark' } });
    expect(onRowChange).toHaveBeenCalledWith('1', { remarks: 'New remark' });
  });
});
