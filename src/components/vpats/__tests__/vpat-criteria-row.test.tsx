import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { Table, TableBody } from '@/components/ui/table';
import { VpatCriteriaRow } from '@/components/vpats/vpat-criteria-row';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

// react-hook-form register mock — returns ref + name so the Textarea spread works.
type RemarksFormValues = Record<string, string>;
const mockRegister = ((name: string) => ({
  name,
  ref: vi.fn(),
  onChange: vi.fn(),
  onBlur: vi.fn(),
})) as unknown as UseFormRegister<RemarksFormValues>;

const makeRow = (overrides: Partial<VpatCriterionRow> = {}): VpatCriterionRow => ({
  id: '1',
  vpat_id: 'v1',
  criterion_id: 'c1',
  criterion_code: '1.1.1',
  criterion_name: 'Non-text Content',
  criterion_name_translated: null,
  criterion_description: 'All non-text content has a text alternative.',
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

// Wrap in a Table/TableBody so the TableRow renders without HTML warnings.
const wrap = (ui: React.ReactElement) =>
  render(
    <Table>
      <TableBody>{ui}</TableBody>
    </Table>
  );

describe('VpatCriteriaRow', () => {
  it('renders criterion code and name', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByText('1.1.1')).toBeInTheDocument();
    expect(screen.getByText('Non-text Content')).toBeInTheDocument();
  });

  it('applies amber border when conformance is not_evaluated and not readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ conformance: 'not_evaluated' })}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByTestId('row-1')).toHaveClass('border-amber-400');
  });

  it('does not apply amber border when conformance is set', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ conformance: 'supports' })}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByTestId('row-1')).not.toHaveClass('border-amber-400');
  });

  it('renders conformance select when not readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByRole('combobox', { name: /conformance for 1.1.1/i })).toBeInTheDocument();
  });

  it('renders conformance label text when readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ conformance: 'supports' })}
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Supports')).toBeInTheDocument();
  });

  it('calls onRowChange when conformance select changes', () => {
    const onRowChange = vi.fn();
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={onRowChange}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    const select = screen.getByRole('combobox', { name: /conformance for 1.1.1/i });
    fireEvent.click(select);
    fireEvent.click(screen.getByRole('option', { name: /supports$/i }));
    expect(onRowChange).toHaveBeenCalledWith('1', { conformance: 'supports' });
  });

  it('renders remarks textarea when not readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByRole('textbox', { name: /remarks for 1.1.1/i })).toBeInTheDocument();
  });

  it('renders remarks text when readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ remarks: 'Some remarks' })}
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByText('Some remarks')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows Generate button when aiEnabled and not readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={true}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByRole('button', { name: /generate for 1.1.1/i })).toBeInTheDocument();
  });

  it('hides Generate button when readOnly', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={true}
        aiEnabled={true}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByRole('button', { name: /generate for 1.1.1/i })).not.toBeInTheDocument();
  });

  it('calls onGenerateRow with row id when Generate button clicked', () => {
    const onGenerateRow = vi.fn();
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={true}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={onGenerateRow}
        register={mockRegister}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /generate for 1.1.1/i }));
    expect(onGenerateRow).toHaveBeenCalledWith('1');
  });

  it('shows Generating label and disables button when isGenerating is true', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={true}
        isGenerating={true}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={vi.fn()}
        register={mockRegister}
      />
    );
    const btn = screen.getByRole('button', { name: /generating for 1.1.1/i });
    expect(btn).toBeDisabled();
  });

  it('shows issue count after criterion name when issue_count > 0', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ issue_count: 3 })}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('does not show issue count when issue_count is 0', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ issue_count: 0 })}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('renders criterion name as a link button when onCriterionClick is provided', () => {
    const onCriterionClick = vi.fn();
    wrap(
      <VpatCriteriaRow
        row={makeRow()}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onCriterionClick={onCriterionClick}
        register={mockRegister}
      />
    );
    const btn = screen.getByRole('button', { name: /view issues for 1.1.1/i });
    fireEvent.click(btn);
    expect(onCriterionClick).toHaveBeenCalledWith('1.1.1');
  });

  it('shows AI info button when row has ai_confidence', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ ai_confidence: 'high', remarks: 'text' })}
        isEven={false}
        readOnly={false}
        aiEnabled={true}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={vi.fn()}
        onAiInfoClick={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByRole('button', { name: /ai info for 1.1.1/i })).toBeInTheDocument();
  });

  it('calls onAiInfoClick with row when AI info button clicked', () => {
    const onAiInfoClick = vi.fn();
    const row = makeRow({ ai_confidence: 'high', remarks: 'text' });
    wrap(
      <VpatCriteriaRow
        row={row}
        isEven={false}
        readOnly={false}
        aiEnabled={true}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        onGenerateRow={vi.fn()}
        onAiInfoClick={onAiInfoClick}
        register={mockRegister}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /ai info for 1.1.1/i }));
    expect(onAiInfoClick).toHaveBeenCalledWith(row);
  });
});

describe('EN badge for untranslated criteria', () => {
  it('shows EN badge when locale is not en and criterion_name_translated is null', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ criterion_name_translated: null })}
        locale="fr"
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('does not show EN badge when locale is en', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ criterion_name_translated: null })}
        locale="en"
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByText('EN')).not.toBeInTheDocument();
  });

  it('does not show EN badge when criterion_name_translated is provided', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ criterion_name_translated: 'Contenu non textuel' })}
        locale="fr"
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByText('EN')).not.toBeInTheDocument();
  });

  it('shows translated name when criterion_name_translated is provided', () => {
    wrap(
      <VpatCriteriaRow
        row={makeRow({ criterion_name_translated: 'Contenu non textuel' })}
        locale="fr"
        isEven={false}
        readOnly={true}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByText('Contenu non textuel')).toBeInTheDocument();
  });
});
